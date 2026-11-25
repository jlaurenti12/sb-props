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
import { IoTrophyOutline } from "react-icons/io5";
import { findTeam } from "../../data/nflTeams";
import { BOX_QUARTERS, quarterPayouts, readQuarterScore } from "../../data/boxQuarters";

const GRID_SIZE = 10;
const SQUARE_PRICE = 10;

const squareId = (row, col) => `${row}-${col}`;

const shortName = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "Someone";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

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
  const [quarterScores, setQuarterScores] = useState(null);
  const [paidCount, setPaidCount] = useState(0);
  const [displayName, setDisplayName] = useState("");
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
      setQuarterScores(
        data.boxQuarterScores && typeof data.boxQuarterScores === "object"
          ? data.boxQuarterScores
          : null
      );
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
  const selecting = drafts.length > 0;
  const pricePerSquare = typeof boxPrice === "number" ? boxPrice : SQUARE_PRICE;
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
    if (!claimsOpen || busy || !displayName) return;
    setBusy(true);
    setNotice("");
    setConfirmation(null);
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
    if (busy || drafts.length === 0) return;
    setBusy(true);
    setNotice("");
    try {
      const batch = writeBatch(db);
      drafts.forEach((square) => {
        batch.delete(doc(db, "games", year, "boxSquares", square.id));
      });
      await batch.commit();
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
      setConfirmation({
        count: added,
        entryAmount: added * pricePerSquare,
      });
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
  const rowTeamColor = findTeam(rowTeam)?.color;
  const colTeamColor = findTeam(colTeam)?.color;
  const pool = Object.values(squares).filter((square) => square.submitted !== false).length * pricePerSquare;
  const payouts = quarterPayouts(pool);
  const quarterResults = BOX_QUARTERS.map((quarter) => {
    const score = readQuarterScore(quarterScores, quarter.id);
    if (!score || !numbersUp) return { ...quarter, score: null };
    const row = rowNumbers.indexOf(score.rowDigit);
    const col = colNumbers.indexOf(score.colDigit);
    const square = squares[squareId(row, col)];
    const winner = !square
      ? "Open square"
      : square.uid === user?.uid
        ? "You"
        : shortName(square.name);
    return { ...quarter, score, row, col, winner };
  });
  const winningBadges = new Map();
  quarterResults.forEach((quarter) => {
    if (!quarter.score) return;
    const id = squareId(quarter.row, quarter.col);
    const list = winningBadges.get(id) || [];
    list.push({
      badge: quarter.id === "half" ? "H" : quarter.id === "final" ? "F" : quarter.label,
      name: quarter.label,
      place: quarter.id,
    });
    winningBadges.set(id, list);
  });
  const statusLine =
    boxesStatus === "locked"
      ? numbersUp
        ? ""
        : "Claims are closed. Numbers haven't been drawn."
      : boxesStatus === "open"
        ? boardLoaded
          ? `Tap an open square to take it. ${squaresLeft} ${squaresLeft === 1 ? "box remains" : "boxes remain"}.`
          : "Tap an open square to take it."
        : "Claims haven't opened yet.";

  const draftTotal = drafts.length * pricePerSquare;
  const balanceAfterSubmit =
    Math.max(0, submitted.length + drafts.length - paidCount) * pricePerSquare;
  const venmoName = venmoHandle || "Jacob-Laurenti";

  if (confirmation) {
    const boxLabel = confirmation.count === 1 ? "box" : "boxes";
    return (
      <div className="rounded-lg bg-content1 p-6 text-center grid gap-4">
        <div className="text-xl font-semibold">Entry submitted!</div>
        <div className="text-default-600">
          You selected {confirmation.count} {boxLabel}. Venmo {money(confirmation.entryAmount)} to{" "}
          <span className="font-semibold text-foreground whitespace-nowrap">@{venmoName}</span> to
          complete your entry.
        </div>
        <div className="text-default-600">
          Please don't mention anything about betting in the description 🙏
        </div>
        <Button fullWidth color="primary" onPress={() => setConfirmation(null)}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${selecting ? "pb-36" : ""}`}>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Your boxes</h2>
        <p className="mt-1 text-sm text-default-500">{statusLine}</p>
      </div>

      {selecting && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-default-200 bg-background/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[375px] flex-col gap-3 px-4 py-4">
            <p className="text-sm text-foreground">
              {drafts.length} {drafts.length === 1 ? "square" : "squares"}
              {` · ${money(draftTotal)}`}
            </p>
            {venmoHandle && balanceAfterSubmit > 0 && (
              <p className="text-sm text-default-500">
                After you submit, Venmo @{venmoHandle} {money(balanceAfterSubmit)}.
              </p>
            )}
            {!claimsOpen && (
              <p className="text-sm text-default-500">
                Claims closed before this entry was submitted.
              </p>
            )}
            <div className="flex gap-2">
              <Button className="flex-1" variant="flat" isDisabled={busy} onPress={onCancel}>
                Cancel
              </Button>
              <Button
                className="flex-[2]"
                color="secondary"
                isDisabled={busy || !claimsOpen}
                onPress={onSubmit}
              >
                Select boxes
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={numbersUp ? "grid grid-cols-[auto_minmax(0,1fr)] gap-0.5" : ""}>
          {numbersUp && (
            <div
              className="col-start-2 row-start-1 rounded-[3px] border text-[10px] font-semibold leading-none text-foreground"
              style={colTeamColor ? { borderColor: colTeamColor, backgroundColor: `${colTeamColor}2e` } : undefined}
            >
              {colTeam && (
                <div className="px-1 pt-1 text-center tracking-wide">{colTeam}</div>
              )}
              <div className="grid grid-cols-10 gap-0.5 py-0.5">
                {colNumbers.map((digit, index) => (
                  <div key={`col-${index}`} className="text-center">
                    {digit}
                  </div>
                ))}
              </div>
            </div>
          )}
          {numbersUp && (
            <div
              className="col-start-1 row-start-2 flex min-h-0 items-stretch overflow-hidden rounded-[3px] border text-[10px] font-semibold leading-none text-foreground"
              style={rowTeamColor ? { borderColor: rowTeamColor, backgroundColor: `${rowTeamColor}2e` } : undefined}
            >
              {rowTeam && (
                <span className="flex h-full items-center justify-center px-0.5">
                  <span className="tracking-wide [writing-mode:vertical-lr] rotate-180">
                    {rowTeam}
                  </span>
                </span>
              )}
              <div className="grid h-full w-4 grid-rows-10 gap-0.5">
                {rowNumbers.map((digit, index) => (
                  <div key={`row-${index}`} className="flex items-center justify-center">
                    {digit}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div
            className={numbersUp ? "col-start-2 row-start-2 grid min-w-0 grid-cols-10 gap-0.5" : "grid grid-cols-10 gap-0.5"}
            role="grid"
            aria-label="Super Bowl boxes"
          >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
          const row = Math.floor(index / GRID_SIZE);
          const col = index % GRID_SIZE;
          const id = squareId(row, col);
          const square = squares[id];
          const mine = square?.uid === user?.uid;
          const draft = mine && square?.submitted === false;
          const held = Boolean(square) && !mine && square.submitted === false;
          const rowLabel = numbersUp ? `${rowTeam ? `${rowTeam} ` : ""}${rowNumbers[row]}` : row + 1;
          const colLabel = numbersUp ? `${colTeam ? `${colTeam} ` : ""}${colNumbers[col]}` : col + 1;
          const label = !square
            ? `Open square, row ${rowLabel}, column ${colLabel}`
            : draft
              ? `Your square, not submitted yet, row ${rowLabel}, column ${colLabel}`
              : held
                ? `${square.name} is still selecting this square, row ${rowLabel}, column ${colLabel}`
                : mine
                  ? `Your square, row ${rowLabel}, column ${colLabel}`
                  : `${square.name}, row ${rowLabel}, column ${colLabel}`;
          const badges = winningBadges.get(id);
          const cell = (
            <button
              key={id}
              type="button"
              role="gridcell"
              aria-label={badges ? `${label}, winning ${badges.map((badge) => badge.name).join(" and ")}` : label}
              disabled={busy || (!square && (!claimsOpen || !displayName))}
              onClick={() => {
                if (!claimsOpen) {
                  if (!square) return;
                  setSelectedId((current) => (current === id ? null : id));
                  return;
                }
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
                "relative flex aspect-square items-center justify-center rounded-[3px] text-[10px] font-semibold leading-none",
                !square || held
                  ? "bg-default-100 text-default-500"
                  : mine
                    ? "bg-primary text-primary-foreground"
                    : "bg-default-400 text-white",
                draft ? "box-draft" : "",
                held ? "box-held" : "",
                selectedId === id ? "outline outline-2 outline-offset-1 outline-white" : "",
                claimsOpen && !square ? "hover:bg-default-200" : "",
                "disabled:cursor-default disabled:opacity-100",
              ].join(" ")}
            >
              {badges && badges.map((badge) => (
                <span
                  key={badge.name}
                  title={badge.name}
                  className={`absolute bg-success px-0.5 text-[7px] font-bold leading-[10px] text-success-foreground ${
                    badge.place === "q1"
                      ? "-left-px -top-px rounded-br-[2px] rounded-tl-[3px]"
                      : badge.place === "half"
                        ? "-right-px -top-px rounded-bl-[2px] rounded-tr-[3px]"
                        : badge.place === "q3"
                          ? "-bottom-px -right-px rounded-br-[3px] rounded-tl-[2px]"
                          : "-bottom-px -left-px rounded-bl-[3px] rounded-tr-[2px]"
                  }`}
                >
                  {badge.badge}
                </span>
              ))}
              {square ? (mine ? "You" : initialsFor(square.name)) : ""}
            </button>
          );
          return cell;
        })}
          </div>
      </div>

      {squares[selectedId] && (
        <p className="text-sm text-foreground">
          {squares[selectedId].uid === user?.uid ? "You" : shortName(squares[selectedId].name)}
          {squares[selectedId].submitted === false ? " (still selecting)" : ""}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Leaderboard</h2>
          {/* <p className="mt-1 text-sm text-default-500">Winners display here as scores update.</p> */}
        </div>
        <div className="rounded-lg bg-default-100 p-3">
          <div className={submitted.length > 0 ? "grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" : ""}>
            <div className={submitted.length > 0 ? "pr-3" : ""}>
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <IoTrophyOutline aria-hidden="true" />
                Winners
              </div>
              <ol className="mt-3 flex flex-col">
                {quarterResults.map((quarter, index) => (
                  <li key={quarter.id} className="flex items-center gap-2">
                    <div className="relative flex w-8 shrink-0 items-center justify-center self-stretch">
                      {index < quarterResults.length - 1 && (
                        <span className="absolute top-1/2 -bottom-1/2 w-px bg-default-300" aria-hidden="true" />
                      )}
                      <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-default-300 bg-default-100 text-[11px] font-semibold text-foreground">
                        {quarter.id === "half" ? "H" : quarter.id === "final" ? "F" : quarter.label}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 py-3">
                      <div className="flex items-center gap-1">
                        <p
                          className={`min-w-0 flex-1 truncate text-sm font-semibold ${quarter.score ? "text-foreground" : "text-default-400"}`}
                          title={quarter.score ? quarter.winner : undefined}
                        >
                          {quarter.score ? quarter.winner : "Upcoming"}
                        </p>
                        {quarter.score && (
                          <>
                            <span
                              className="shrink-0 rounded-[3px] border px-1 py-0.5 text-[11px] font-semibold leading-none text-foreground"
                              style={rowTeamColor ? { borderColor: rowTeamColor, backgroundColor: `${rowTeamColor}2e` } : undefined}
                            >
                              {quarter.score.row}
                            </span>
                            <span
                              className="shrink-0 rounded-[3px] border px-1 py-0.5 text-[11px] font-semibold leading-none text-foreground"
                              style={colTeamColor ? { borderColor: colTeamColor, backgroundColor: `${colTeamColor}2e` } : undefined}
                            >
                              {quarter.score.col}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-default-500">
                        {Number(payouts[quarter.id]).toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            {submitted.length > 0 && (
              <div className="border-l border-default-300 pl-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  Your boxes
                </div>
                {numbersUp ? (
                  <>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground">
                      <span className="min-w-6 flex-1 text-center">{rowTeam || "Left"}</span>
                      <span className="invisible" aria-hidden="true">·</span>
                      <span className="min-w-6 flex-1 text-center">{colTeam || "Top"}</span>
                    </div>
                    <ul className="mt-1.5 flex flex-col gap-2">
                      {submitted.map((square) => (
                        <li key={square.id} className="flex items-center gap-1.5">
                          <span
                            className="flex min-w-6 flex-1 items-center justify-center rounded-[3px] border px-1.5 py-1 text-sm font-semibold leading-none text-foreground"
                            style={rowTeamColor ? { borderColor: rowTeamColor, backgroundColor: `${rowTeamColor}2e` } : undefined}
                          >
                            {rowNumbers[square.row]}
                          </span>
                          <span className="text-default-400">·</span>
                          <span
                            className="flex min-w-6 flex-1 items-center justify-center rounded-[3px] border px-1.5 py-1 text-sm font-semibold leading-none text-foreground"
                            style={colTeamColor ? { borderColor: colTeamColor, backgroundColor: `${colTeamColor}2e` } : undefined}
                          >
                            {colNumbers[square.col]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mt-3 text-xs text-default-500">
                    Your {submitted.length} {submitted.length === 1 ? "entry shows" : "entries show"} up here once the numbers are drawn.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {notice && <p className="text-sm text-danger">{notice}</p>}
    </div>
  );
}

export default BoxesPanel;
