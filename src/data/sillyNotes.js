const NOTES = [
  "fancy stickers",
  "pizza tax",
  "cat rent",
  "mystery snacks",
  "tiny hat fund",
  "extra guacamole",
  "premium high fives",
  "sock sorting",
  "a very official sandwich",
  "cloud storage for feelings",
  "one goose, shipping included",
  "museum of leftovers",
  "professional loafing",
  "the good snacks",
  "plant whispering",
  "rare air, bottled",
  "consulting on naps",
  "parking for a duck",
  "birthday energy, late",
  "a paperclip, expedited",
];

export const sillyNote = () => NOTES[Math.floor(Math.random() * NOTES.length)];

export const venmoPayUrl = ({ handle, amount, note }) => {
  const username = String(handle || "").replace(/^@/, "");
  const dollars = Number(amount);
  const params = new URLSearchParams({
    txn: "pay",
    audience: "private",
    recipients: username,
    amount: Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2),
    note: note || "",
  });
  return `https://venmo.com/?${params.toString()}`;
};
