/**
 * csv.js
 *
 * Parses OHLCV CSV data into the bar format used by strategy.js/backtest.js.
 * Accepts common column name variants (from yfinance, Yahoo Finance web
 * export, Stooq, or our own data_fetch.py output).
 */

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("CSV appears to be empty");

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const col = (names) => {
    for (const n of names) {
      const idx = header.indexOf(n);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const dateIdx = col(["date"]);
  const openIdx = col(["open"]);
  const highIdx = col(["high"]);
  const lowIdx = col(["low"]);
  const closeIdx = col(["close", "adj close", "close*"]);
  const volIdx = col(["volume"]);

  if (dateIdx === -1 || closeIdx === -1) {
    throw new Error(
      "CSV must have at least 'Date' and 'Close' columns. Found headers: " + header.join(", ")
    );
  }

  const bars = [];
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    const cells = raw.split(",");
    const close = parseFloat(cells[closeIdx]);
    if (Number.isNaN(close)) continue;

    bars.push({
      date: cells[dateIdx],
      open: openIdx !== -1 ? parseFloat(cells[openIdx]) : close,
      high: highIdx !== -1 ? parseFloat(cells[highIdx]) : close,
      low: lowIdx !== -1 ? parseFloat(cells[lowIdx]) : close,
      close,
      volume: volIdx !== -1 ? parseFloat(cells[volIdx]) : 0,
    });
  }

  // Ensure chronological order (oldest first)
  bars.sort((a, b) => new Date(a.date) - new Date(b.date));

  return bars;
}

if (typeof module !== "undefined") {
  module.exports = { parseCSV };
}
