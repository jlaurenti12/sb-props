import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../services/firebase";
import {
  collection,
  deleteField,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { Button, Input } from "@heroui/react";

const money = (amount) =>
  Number(amount).toLocaleString("en-US", { style: "currency", currency: "USD" });

function BoxesAdmin({ year }) {
  const [squares, setSquares] = useState([]);
  const [entries, setEntries] = useState({});
  const [priceInput, setPriceInput] = useState("10");
  const [venmoInput, setVenmoInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyUid, setBusyUid] = useState(null);

  useEffect(() => {
    setHydrated(false);
    setSquares([]);
    setEntries({});
  }, [year]);

  useEffect(() => {
    if (!year || hydrated) return undefined;
    const unsubscribe = onSnapshot(doc(db, "games", year), (snapshot) => {
      const data = snapshot.data() || {};
      setPriceInput(data.boxPrice != null ? String(data.boxPrice) : "10");
      setVenmoInput(data.venmoHandle || "");
      setHydrated(true);
    });
    return unsubscribe;
  }, [year, hydrated]);

  useEffect(() => {
    if (!year) return undefined;
    const unsubscribe = onSnapshot(collection(db, "games", year, "boxSquares"), (snapshot) => {
      setSquares(snapshot.docs.map((squareDoc) => ({ id: squareDoc.id, ...squareDoc.data() })));
    });
    return unsubscribe;
  }, [year]);

  useEffect(() => {
    if (!year) return undefined;
    const unsubscribe = onSnapshot(collection(db, "games", year, "boxEntries"), (snapshot) => {
      const next = {};
      snapshot.docs.forEach((entryDoc) => {
        next[entryDoc.id] = entryDoc.data();
      });
      setEntries(next);
    });
    return unsubscribe;
  }, [year]);

  const people = useMemo(() => {
    const grouped = {};
    squares.forEach((square) => {
      if (!grouped[square.uid]) {
        grouped[square.uid] = {
          uid: square.uid,
          name: square.name,
          squares: [],
        };
      }
      grouped[square.uid].squares.push(square);
      if (square.name) grouped[square.uid].name = square.name;
    });
    return Object.values(grouped)
      .map((person) => {
        const submitted = person.squares.filter((square) => square.submitted !== false).length;
        const paidCount = entries[person.uid]?.paidCount || 0;
        return {
          ...person,
          submitted,
          drafts: person.squares.length - submitted,
          paidCount,
          owed: Math.max(0, submitted - paidCount),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [squares, entries]);

  const price = priceInput === "" ? null : Number(priceInput);

  const savePayment = async () => {
    if (price != null && (!Number.isFinite(price) || price < 0)) {
      alert("Enter a price of 0 or more.");
      return;
    }
    setSaving(true);
    try {
      const handle = venmoInput.trim().replace(/^@/, "");
      await updateDoc(doc(db, "games", year), {
        boxPrice: price == null ? deleteField() : price,
        venmoHandle: handle ? handle : deleteField(),
      });
    } catch (err) {
      console.error(err);
      alert("Couldn't save the boxes payment details.");
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (person, paid) => {
    setBusyUid(person.uid);
    try {
      await setDoc(
        doc(db, "games", year, "boxEntries", person.uid),
        {
          uid: person.uid,
          name: person.name,
          paidCount: paid ? person.submitted : 0,
        },
        { merge: true }
      );
    } catch (err) {
      console.error(err);
      alert("Couldn't update payment.");
    } finally {
      setBusyUid(null);
    }
  };

  const removeEntry = async (person) => {
    if (
      !window.confirm(
        `Remove ${person.name}'s ${person.squares.length} squares? They'll open up on the board.`
      )
    ) {
      return;
    }
    setBusyUid(person.uid);
    try {
      const batch = writeBatch(db);
      person.squares.forEach((square) => {
        batch.delete(doc(db, "games", year, "boxSquares", square.id));
      });
      if (entries[person.uid]) {
        batch.delete(doc(db, "games", year, "boxEntries", person.uid));
      }
      await batch.commit();
    } catch (err) {
      console.error(err);
      alert("Couldn't remove that entry.");
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4 text-foreground">Boxes</h2>
      <div className="rounded-xl bg-default-50 p-4 sm:p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-default-600">Payment</h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <Input
              type="number"
              min="0"
              label="Price per square"
              labelPlacement="inside"
              value={priceInput}
              onValueChange={setPriceInput}
              className="sm:max-w-[160px]"
            />
            <Input
              label="Venmo username"
              labelPlacement="inside"
              value={venmoInput}
              onValueChange={setVenmoInput}
              className="sm:max-w-[220px]"
            />
            <Button color="secondary" isDisabled={saving} onPress={savePayment}>
              Save
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-default-600">Entries</h3>
          {people.length === 0 ? (
            <p className="text-sm text-default-500">No squares claimed yet.</p>
          ) : (
            people.map((person) => {
              const owedAmount = price == null ? null : person.owed * price;
              return (
                <div
                  key={person.uid}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{person.name}</p>
                    <p className="text-xs text-default-500">
                      {person.submitted} submitted
                      {person.drafts > 0 ? ` · ${person.drafts} not submitted` : ""}
                      {owedAmount != null && person.owed > 0 ? ` · owes ${money(owedAmount)}` : ""}
                      {person.submitted > 0 && person.owed === 0 ? " · paid" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {person.submitted > 0 && (
                      <Button
                        size="sm"
                        variant="flat"
                        isDisabled={busyUid === person.uid}
                        onPress={() => markPaid(person, person.owed > 0)}
                      >
                        {person.owed > 0 ? "Mark paid" : "Mark unpaid"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="flat"
                      color="danger"
                      isDisabled={busyUid === person.uid}
                      onPress={() => removeEntry(person)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

export default BoxesAdmin;
