import React, { useEffect, useMemo, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../services/firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  writeBatch,
} from "firebase/firestore";
import { Button } from "@heroui/react";

const GRID_SIZE = 10;
const SQUARE_PRICE = 10;

const squareId = (row, col) => `${row}-${col}`;

const initialsFor = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const money = (amount) =>
  Number(amount).toLocaleString("en-US", { style: "currency", currency: "USD" });

const digitAxis = (value) =>
  Array.isArray(value) &&
  value.length === GRID_SIZE &&
  value.every((digit) => Number.isInteger(digit) && digit >= 0 && digit <= 9) &&
  new Set(value).size === GRID_SIZE
    ? value
    : null;

const venmoHref = (handle, amount, year) => {
  const params = new URLSearchParams({
    txn: "pay",
    audience: "private",
    recipients: handle,
    amount: Number(amount).toFixed(2),
    note: `Super Bowl boxes ${year}`,
  });
  return `https://venmo.com/?${params.toString()}`;
};

function BoxesPanel({ year }) {
  const [user] = useAuthState(auth);
  const [squares, setSquares] = useState({});
  const [boardLoaded, setBoardLoaded] = useState(false);
  const [boxesStatus, setBoxesStatus] = useState("setup");
  const [boxPrice, setBoxPrice] = useState(null);
  const [venmoHandle, setVenmoHandle] = useState("");
  const [rowNumbers, setRowNumbers] = useState(null);
  const [colNumbers, setColNumbers] = useState(null);
  const [rowTeam, setRowTeam] = useState("");
  const [colTeam, setColTeam] = useState("");
  const [paidCount, setPaidCount] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [choosing, setChoosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    if (!year) return undefined;
    setBoardLoaded(false);
    setSquares({});
    setSelectedId(null);
    setNotice("");
    setChoosing(false);
    setConfirmation(null);
    const unsubscribe = onSnapshot(
      collection(db, "games", year, "boxSquares"),
      (snapshot) => {
        const next = {};
        snapshot.docs.forEach((squareDoc) => {
          next[squareDoc.id] = { id: squareDoc.id, ...squareDoc.data() };
        });
        setSquares(next);
        setBoardLoaded(true);
      },
      (err) => {
        console.error(err);
        setBoardLoaded(true);
        setNotice(
          err.code === "permission-denied"
            ? "The board couldn't load. Square rules still need to be published."
            : "The board couldn't load."
        );
      }
    );
    return unsubscribe;
  }, [year]);

  useEffect(() => {
    if (!year) return undefined;
    const unsubscribe = onSnapshot(doc(db, "games", year), (snapshot) => {
      const data = snapshot.data() || {};
      const status = data.boxesStatus;
      setBoxesStatus(status === "open" || status === "locked" ? status : "setup");
      setBoxPrice(typeof data.boxPrice === "number" ? data.boxPrice : null);
      setVenmoHandle(
        typeof data.venmoHandle === "string" ? data.venmoHandle.trim().replace(/^@/, "") : ""
      );
      setRowNumbers(digitAxis(data.boxRowNumbers));
      setColNumbers(digitAxis(data.boxColNumbers));
      setRowTeam(typeof data.boxRowTeam === "string" ? data.boxRowTeam.trim() : "");
      setColTeam(typeof data.boxColTeam === "string" ? data.boxColTeam.trim() : "");
    });
    return unsubscribe;
  }, [year]);

  useEffect(() => {
    if (!year || !user) return undefined;
    const unsubscribe = onSnapshot(
      doc(db, "games", year, "boxEntries", user.uid),
      (snapshot) => {
        const count = snapshot.data()?.paidCount;
        setPaidCount(typeof count === "number" ? count : 0);
      }
    );
    return unsubscribe;
  }, [year, user]);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    getDoc(doc(db, "users", user.uid))
      .then((snapshot) => {
        if (!active) return;
        setDisplayName(snapshot.data()?.name || user.displayName || "Player");
      })
      .catch((err) => {
        console.error(err);
        if (active) setDisplayName(user.displayName || "Player");
      });
    return () => {
      active = false;
    };
  }, [user]);

  const claimsOpen = boxesStatus === "open";
  const mySquares = useMemo(
    () =>
      Object.values(squares)
        .filter((square) => square.uid === user?.uid)
        .sort((a, b) => a.row - b.row || a.col - b.col),
    [squares, user]
  );
  const drafts = mySquares.filter((square) => square.submitted === false);
  const submitted = mySquares.filter((square) => square.submitted !== false);
  const inEntry = choosing || drafts.length > 0;
  const pricePerSquare = typeof boxPrice === "number" ? boxPrice : SQUARE_PRICE;
  const owedSquares = Math.max(0, submitted.length - paidCount);
  const owedAmount = owedSquares * pricePerSquare;
  const squaresLeft = GRID_SIZE * GRID_SIZE - Object.keys(squares).length;

  const claimCell = async (row, col) => {
    const ref = doc(db, "games", year, "boxSquares", squareId(row, col));
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.exists()) {
        const taken = new Error("taken");
        taken.code = "taken";
        throw taken;
      }
      transaction.set(ref, {
        uid: user.uid,
        name: displayName,
        row,
        col,
        submitted: false,
      });
    });
  };

  const onClaimCell = async (row, col) => {
    if (!claimsOpen || !inEntry || busy || !displayName) return;
    setBusy(true);
    setNotice("");
    try {
      await claimCell(row, col);
    } catch (err) {
      console.error(err);
      if (err.code === "taken") {
        setNotice("That square was just taken.");
      } else if (err.code === "permission-denied") {
        setNotice("Claims aren't open right now.");
      } else {
        setNotice("Couldn't claim that square.");
      }
    } finally {
      setBusy(false);
    }
  };

  const onReleaseDraft = async (square) => {
    if (!claimsOpen || busy || square.submitted !== false) return;
    setBusy(true);
    setNotice("");
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "games", year, "boxSquares", square.id));
      await batch.commit();
    } catch (err) {
      console.error(err);
      setNotice("Couldn't release that square.");
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async () => {
    if (busy) return;
    if (drafts.length === 0) {
      setChoosing(false);
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const batch = writeBatch(db);
      drafts.forEach((square) => {
        batch.delete(doc(db, "games", year, "boxSquares", square.id));
      });
      await batch.commit();
      setChoosing(false);
    } catch (err) {
      console.error(err);
      setNotice("Couldn't cancel this entry.");
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async () => {
    if (!claimsOpen || busy || drafts.length === 0 || !displayName) return;
    setBusy(true);
    setNotice("");
    try {
      const batch = writeBatch(db);
      drafts.forEach((square) => {
        batch.update(doc(db, "games", year, "boxSquares", square.id), {
          submitted: true,
        });
      });
      batch.set(
        doc(db, "games", year, "boxEntries", user.uid),
        { uid: user.uid, name: displayName },
        { merge: true }
      );
      await batch.commit();
      const added = drafts.length;
      const nextOwedSquares = Math.max(0, submitted.length + added - paidCount);
      setConfirmation({
        count: added,
        entryAmount: added * pricePerSquare,
        owedAmount: nextOwedSquares * pricePerSquare,
      });
      setChoosing(false);
    } catch (err) {
      console.error(err);
      setNotice(
        err.code === "permission-denied"
          ? "Claims aren't open right now."
          : "Couldn't submit this entry."
      );
    } finally {
      setBusy(false);
    }
  };

  const numbersUp = rowNumbers != null && colNumbers != null;
  const statusLine =
    boxesStatus === "locked"
      ? numbersUp
        ? "Numbers are up."
        : "Claims are closed. Numbers haven't been drawn."
      : boxesStatus === "open"
        ? inEntry
          ? "Tap an open square to take it. Submit when you're done."
          : "Numbers stay hidden until claims lock."
        : "Claims haven't opened yet.";

  const openVenmo = (amount) => {
    const pay = amount ?? owedAmount;
    if (!venmoHandle || pay == null || pay <= 0) return;
    window.open(venmoHref(venmoHandle, pay, year), "_blank", "noopener,noreferrer");
  };

  const draftTotal = drafts.length * pricePerSquare;
  const balanceAfterSubmit =
    Math.max(0, submitted.length + drafts.length - paidCount) * pricePerSquare;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Boxes</h2>
        <p className="mt-1 text-sm text-default-500">{statusLine}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-default-100 p-4 text-center min-h-[4.5rem] flex flex-col justify-center">
          <div className="text-small text-default-500 mb-1">Remaining</div>
          <div className="text-lg font-semibold">{boardLoaded ? squaresLeft : "—"}</div>
        </div>
        <div className="rounded-lg bg-default-100 p-4 text-center min-h-[4.5rem] flex flex-col justify-center">
          <div className="text-small text-default-500 mb-1">Your boxes</div>
          <div className="text-lg font-semibold">{boardLoaded ? mySquares.length : "—"}</div>
        </div>
      </div>

      {confirmation && !inEntry && (
        <div className="flex flex-col gap-3 rounded-xl bg-default-100 px-4 py-4">
          <h3 className="text-base font-semibold text-foreground">Entry submitted</h3>
          <p className="text-sm text-foreground">
            {confirmation.count} {confirmation.count === 1 ? "square" : "squares"}
            {` · ${money(confirmation.entryAmount)}`}
          </p>
          {confirmation.owedAmount > 0 && (
            <p className="text-sm text-foreground">
              {venmoHandle
                ? `Venmo @${venmoHandle} ${money(confirmation.owedAmount)}`
                : `You owe ${money(confirmation.owedAmount)}`}
            </p>
          )}
          {confirmation.owedAmount === 0 && (
            <p className="text-sm text-default-500">Paid</p>
          )}
          {venmoHandle && confirmation.owedAmount > 0 && (
            <Button fullWidth color="secondary" onPress={() => openVenmo(confirmation.owedAmount)}>
              Venmo @{venmoHandle}
            </Button>
          )}
          <Button fullWidth variant="flat" onPress={() => setConfirmation(null)}>
            Done
          </Button>
        </div>
      )}

      {!inEntry && !confirmation && owedAmount > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-foreground">
            {venmoHandle
              ? `Venmo @${venmoHandle} ${money(owedAmount)}`
              : `You owe ${money(owedAmount)}`}
          </p>
          {venmoHandle && (
            <Button fullWidth color="secondary" onPress={() => openVenmo(owedAmount)}>
              Venmo @{venmoHandle}
            </Button>
          )}
        </div>
      )}

      {claimsOpen && !inEntry && !confirmation && (
        <Button
          fullWidth
          color="secondary"
          onPress={() => {
            setConfirmation(null);
            setChoosing(true);
          }}
        >
          {submitted.length > 0 ? "Add more squares" : "Add entry"}
        </Button>
      )}

      {inEntry && (
        <div className="flex flex-col gap-3 rounded-xl bg-default-100 px-4 py-4">
          <p className="text-sm font-semibold text-foreground">
            {drafts.length} {drafts.length === 1 ? "square" : "squares"} selected
          </p>
          <p className="text-sm text-foreground">
            {money(pricePerSquare)} a square
            {drafts.length > 0 ? ` · ${money(draftTotal)} this entry` : ""}
          </p>
          {venmoHandle && drafts.length > 0 && balanceAfterSubmit > 0 && (
            <p className="text-sm text-default-500">
              After you submit, Venmo @{venmoHandle} {money(balanceAfterSubmit)}.
            </p>
          )}
          {submitted.length > 0 && (
            <p className="text-sm text-default-500">
              {submitted.length} already submitted
            </p>
          )}
          <Button
            fullWidth
            color="secondary"
            isDisabled={busy || drafts.length === 0 || !claimsOpen}
            onPress={onSubmit}
          >
            Submit
          </Button>
          <Button fullWidth variant="flat" isDisabled={busy} onPress={onCancel}>
            Cancel
          </Button>
          {!claimsOpen && drafts.length > 0 && (
            <p className="text-sm text-default-500">
              Claims closed before this entry was submitted.
            </p>
          )}
        </div>
      )}

      <div className={numbersUp ? "flex items-stretch gap-1" : ""}>
        {numbersUp && rowTeam && (
          <div className="flex w-4 shrink-0 items-center justify-center">
            <span className="text-[10px] font-semibold tracking-wide text-default-500 [writing-mode:vertical-lr]">
              {rowTeam}
            </span>
          </div>
        )}
        <div className={numbersUp ? "min-w-0 flex-1" : "contents"}>
          {numbersUp && colTeam && (
            <div className="mb-1 pl-4 text-center text-[10px] font-semibold tracking-wide text-default-500">
              {colTeam}
            </div>
          )}
          <div
            className={
              numbersUp
                ? "grid grid-cols-[1rem_repeat(10,minmax(0,1fr))] gap-0.5"
                : "grid grid-cols-10 gap-0.5"
            }
            role="grid"
            aria-label="Super Bowl boxes"
          >
        {numbersUp && (
          <>
            <div />
            {colNumbers.map((digit, index) => (
              <div
                key={`col-${index}`}
                className="text-center text-[10px] font-semibold leading-none text-default-500"
              >
                {digit}
              </div>
            ))}
          </>
        )}
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
          const row = Math.floor(index / GRID_SIZE);
          const col = index % GRID_SIZE;
          const id = squareId(row, col);
          const square = squares[id];
          const mine = square?.uid === user?.uid;
          const draft = mine && square?.submitted === false;
          const rowLabel = numbersUp ? `${rowTeam ? `${rowTeam} ` : ""}${rowNumbers[row]}` : row + 1;
          const colLabel = numbersUp ? `${colTeam ? `${colTeam} ` : ""}${colNumbers[col]}` : col + 1;
          const label = square
            ? mine
              ? `Your square, row ${rowLabel}, column ${colLabel}`
              : `${square.name}, row ${rowLabel}, column ${colLabel}`
            : `Open square, row ${rowLabel}, column ${colLabel}`;
          const cell = (
            <button
              key={id}
              type="button"
              role="gridcell"
              aria-label={label}
              disabled={busy || (!square && (!claimsOpen || !inEntry || !displayName))}
              onClick={() => {
                if (!square) {
                  onClaimCell(row, col);
                  return;
                }
                if (draft) {
                  onReleaseDraft(square);
                  return;
                }
                setSelectedId(id);
              }}
              className={[
                "flex aspect-square items-center justify-center rounded-[3px] text-[10px] font-semibold leading-none",
                !square
                  ? "bg-default-100 text-default-400"
                  : mine
                    ? "bg-primary text-primary-foreground"
                    : "bg-default-400 text-white",
                draft ? "opacity-70" : "",
                selectedId === id ? "outline outline-2 outline-offset-1 outline-white" : "",
                claimsOpen && inEntry && !square ? "hover:bg-default-200" : "",
                "disabled:cursor-default disabled:opacity-100",
              ].join(" ")}
            >
              {square ? initialsFor(square.name) : ""}
            </button>
          );
          if (!numbersUp || col !== 0) return cell;
          return (
            <React.Fragment key={id}>
              <div className="flex items-center justify-center text-[10px] font-semibold leading-none text-default-500">
                {rowNumbers[row]}
              </div>
              {cell}
            </React.Fragment>
          );
        })}
          </div>
        </div>
      </div>

      {squares[selectedId] && (
        <p className="text-sm text-foreground">
          {squares[selectedId].uid === user?.uid ? "You" : squares[selectedId].name}
        </p>
      )}

      {notice && <p className="text-sm text-danger">{notice}</p>}
    </div>
  );
}

export default BoxesPanel;
