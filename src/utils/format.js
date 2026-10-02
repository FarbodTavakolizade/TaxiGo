// Small formatting helpers for views (no logic in templates themselves).

/** Formats a timestamp as "YYYY-MM-DD HH:mm" for display. */
function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

module.exports = { formatDateTime };
