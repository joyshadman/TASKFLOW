// src/components/Notes/noteColorValues.js
// Note color palette — subtle variations tuned to the Smoky Violet & Velvet
// theme so cards never clash with the app's glass surfaces.
// Pure data/file (no components) so fast-refresh rules are satisfied.
export const NOTE_COLORS = [
  { key: "default", name: "Default", bg: null },
  { key: "violet", name: "Violet", bg: "#31284F" },
  { key: "plum", name: "Plum", bg: "#3A2540" },
  { key: "lavender", name: "Lavender", bg: "#3B3260" },
  { key: "slate", name: "Slate", bg: "#262434" },
  { key: "mauve", name: "Mauve", bg: "#40233B" },
];

export const colorFor = (key) => {
  const c = NOTE_COLORS.find((x) => x.key === key);
  return c ? c.bg : null;
};