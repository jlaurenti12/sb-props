import React from "react";

// Swatch colors are the bright brand color, so they still read on the dark background.
export const NFL_TEAMS = [
  { name: "Cardinals", city: "Arizona", color: "#C8102E" },
  { name: "Falcons", city: "Atlanta", color: "#A71930" },
  { name: "Ravens", city: "Baltimore", color: "#7B68EE" },
  { name: "Bills", city: "Buffalo", color: "#3B82F6" },
  { name: "Panthers", city: "Carolina", color: "#00A3E0" },
  { name: "Bears", city: "Chicago", color: "#E85D04" },
  { name: "Bengals", city: "Cincinnati", color: "#FB4F14" },
  { name: "Browns", city: "Cleveland", color: "#FF3C00" },
  { name: "Cowboys", city: "Dallas", color: "#4C82FF" },
  { name: "Broncos", city: "Denver", color: "#FB4F14" },
  { name: "Lions", city: "Detroit", color: "#1E90FF" },
  { name: "Packers", city: "Green Bay", color: "#FFB612" },
  { name: "Texans", city: "Houston", color: "#E03A3E" },
  { name: "Colts", city: "Indianapolis", color: "#3D6FE0" },
  { name: "Jaguars", city: "Jacksonville", color: "#D7A22A" },
  { name: "Chiefs", city: "Kansas City", color: "#E31837" },
  { name: "Rams", city: "Los Angeles", color: "#FFD100" },
  { name: "Chargers", city: "Los Angeles", color: "#3AA0E8" },
  { name: "Raiders", city: "Las Vegas", color: "#C0C6C8" },
  { name: "Dolphins", city: "Miami", color: "#00C2C7" },
  { name: "Vikings", city: "Minnesota", color: "#7B4DFF" },
  { name: "Patriots", city: "New England", color: "#C60C30" },
  { name: "Saints", city: "New Orleans", color: "#D3BC8D" },
  { name: "Giants", city: "New York", color: "#5B7CFF" },
  { name: "Jets", city: "New York", color: "#2F9E6B" },
  { name: "Eagles", city: "Philadelphia", color: "#21C58B" },
  { name: "Steelers", city: "Pittsburgh", color: "#FFB612" },
  { name: "49ers", city: "San Francisco", color: "#E23B3B" },
  { name: "Seahawks", city: "Seattle", color: "#69BE28" },
  { name: "Buccaneers", city: "Tampa Bay", color: "#D50A0A" },
  { name: "Titans", city: "Tennessee", color: "#4C8DFF" },
  { name: "Commanders", city: "Washington", color: "#E03A3E" },
];

const ALIASES = {
  niners: "49ers",
  bucs: "Buccaneers",
  pats: "Patriots",
  kc: "Chiefs",
};

const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

const byKey = new Map();
const cityCount = new Map();
NFL_TEAMS.forEach((team) => {
  cityCount.set(team.city, (cityCount.get(team.city) || 0) + 1);
});
NFL_TEAMS.forEach((team) => {
  byKey.set(normalize(team.name), team);
  byKey.set(normalize(`${team.city} ${team.name}`), team);
  if (cityCount.get(team.city) === 1) byKey.set(normalize(team.city), team);
});
Object.entries(ALIASES).forEach(([alias, name]) => {
  const team = byKey.get(normalize(name));
  if (team) byKey.set(alias, team);
});

export const findTeam = (value) => byKey.get(normalize(value)) || null;

export const onTeamColor = (hex) => {
  const n = parseInt(String(hex || "").slice(1), 16);
  if (!Number.isFinite(n)) return "#ffffff";
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = channel((n >> 16) & 255);
  const g = channel((n >> 8) & 255);
  const b = channel(n & 255);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? "#111111" : "#ffffff";
};

export const canonicalTeamName = (value) => findTeam(value)?.name || String(value || "").trim();

export function TeamSwatch({ name }) {
  const team = findTeam(name);
  if (!team) return null;
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full align-middle ring-1 ring-foreground/30"
      style={{ backgroundColor: team.color }}
      aria-hidden="true"
    />
  );
}
