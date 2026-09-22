// src/components/Notes/notes-utils.js
// Small helpers shared by the Notes cards, composer, and editor.

// Render stored note HTML as plain, whitespace-normalized text (for previews
// and search). Runs client-side only inside event/render contexts.
export const stripHtml = (html = "") => {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
};

// Convert composer plain text (with newlines) into HTML for the editor.
export const textToHtml = (text = "") =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

// Compact "last updated" label: time today, short date otherwise.
export const formatWhen = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};