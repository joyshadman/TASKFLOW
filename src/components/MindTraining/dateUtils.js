// Date helpers for Mind Training daily entries.
// The daily identifier uses the user's LOCAL calendar date (YYYY-MM-DD) so
// it never shifts due to UTC conversion (Date.toISOString() is avoided).

export const localDateKey = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};