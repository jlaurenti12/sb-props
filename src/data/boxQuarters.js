export const BOX_QUARTERS = [
  { id: "q1", label: "Q1", share: 0.2 },
  { id: "half", label: "Half", share: 0.2 },
  { id: "q3", label: "Q3", share: 0.2 },
  { id: "final", label: "Final", share: 0.4 },
];

export const quarterPayouts = (pool) => {
  const amounts = {};
  let spent = 0;
  BOX_QUARTERS.forEach((quarter, index) => {
    if (index === BOX_QUARTERS.length - 1) {
      amounts[quarter.id] = pool - spent;
      return;
    }
    const amount = Math.round(pool * quarter.share);
    amounts[quarter.id] = amount;
    spent += amount;
  });
  return amounts;
};

export const readQuarterScore = (scores, id) => {
  const entry = scores && typeof scores === "object" ? scores[id] : null;
  if (!entry || typeof entry !== "object") return null;
  const { row, col } = entry;
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0) return null;
  return { row, col, rowDigit: row % 10, colDigit: col % 10 };
};
