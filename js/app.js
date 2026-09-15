/**
 * app.js
 *
 * Wires the UI together: load data (demo or uploaded CSV) -> run strategy
 * -> run backtest -> render chart, metrics, and trade log.
 *
 * All computation happens in the browser. No data leaves the page.
 */

let currentBars = null;

async function loadDemoData() {
  const res = await fetch("sample_data/DEMO.csv");
  const text = await res.text();
  return parseCSV(text);
}

function setStatus(msg, isError) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = isError ? "status error" : "status";
}

async function handleRun() {
  const fastWindow = parseInt(document.getElementById("fastWindow").value, 10);
  const slowWindow = parseInt(document.getElementById("slowWindow").value, 10);
  const initialCapital = parseFloat(document.getElementById("initialCapital").value);
  const stopLossPct = parseFloat(document.getElementById("stopLoss").value) / 100;

  if (fastWindow >= slowWindow) {
    setStatus("Fast window must be smaller than slow window.", true);
    return;
  }
  if (!currentBars || currentBars.length < slowWindow + 5) {
    setStatus("Not enough data loaded to run this backtest.", true);
    return;
  }

  try {
    const withSignals = movingAverageCrossover(currentBars, fastWindow, slowWindow);
    const result = runBacktest(withSignals, { initialCapital, stopLossPct });
    renderResults(result, currentBars, initialCapital);
    setStatus(`Backtest complete: ${result.trades.length} trades over ${currentBars.length} bars.`);
  } catch (err) {
    setStatus("Error running backtest: " + err.message, true);
  }
}

function renderResults(result, bars, initialCapital) {
  const m = result.metrics;
  document.getElementById("metrics").innerHTML = `
    <div class="metric"><span class="metric-label">Total Return</span><span class="metric-value ${m.totalReturnPct >= 0 ? "pos" : "neg"}">${m.totalReturnPct}%</span></div>
    <div class="metric"><span class="metric-label">CAGR</span><span class="metric-value ${m.cagrPct >= 0 ? "pos" : "neg"}">${m.cagrPct}%</span></div>
    <div class="metric"><span class="metric-label">Sharpe Ratio</span><span class="metric-value">${m.sharpeRatio}</span></div>
    <div class="metric"><span class="metric-label">Max Drawdown</span><span class="metric-value neg">${m.maxDrawdownPct}%</span></div>
    <div class="metric"><span class="metric-label">Final Equity</span><span class="metric-value">$${m.finalEquity.toLocaleString()}</span></div>
    <div class="metric"><span class="metric-label">Trades</span><span class="metric-value">${result.trades.length}</span></div>
  `;

  // Buy-and-hold comparison series (same starting capital)
  const firstClose = bars[0].close;
  const buyHoldEquity = bars.map((b) => (b.close / firstClose) * initialCapital);
  const strategyEquity = result.equityCurve.map((e) => e.equity);
  const dates = bars.map((b) => b.date);

  const bhReturn = ((buyHoldEquity[buyHoldEquity.length - 1] / initialCapital) - 1) * 100;
  document.getElementById("bh-comparison").textContent =
    `Buy-and-hold over the same period: ${bhReturn.toFixed(2)}%. ` +
    (m.totalReturnPct > bhReturn
      ? "This run's strategy beat buy-and-hold on this data."
      : "This run's strategy did not beat buy-and-hold on this data.");

  const canvas = document.getElementById("equityChart");
  drawLineChart(
    canvas,
    [
      { label: "Strategy", values: strategyEquity, color: "#2563eb" },
      { label: "Buy & Hold", values: buyHoldEquity, color: "#9ca3af" },
    ],
    { xLabels: dates, yFormat: "currency" }
  );

  const tbody = document.getElementById("tradeLog");
  tbody.innerHTML = result.trades
    .map(
      (t) => `<tr>
        <td>${t.date}</td>
        <td class="${t.action === "BUY" ? "pos" : "neg"}">${t.action}</td>
        <td>$${t.price.toFixed(2)}</td>
        <td>${t.shares}</td>
        <td>$${t.cashAfter.toFixed(2)}</td>
      </tr>`
    )
    .join("");
}

async function init() {
  setStatus("Loading demo data...");
  try {
    currentBars = await loadDemoData();
    setStatus(`Loaded ${currentBars.length} bars of synthetic demo data. Click "Run Backtest" or upload your own CSV.`);
  } catch (err) {
    setStatus("Could not load demo data: " + err.message, true);
  }

  document.getElementById("runBtn").addEventListener("click", handleRun);

  document.getElementById("csvUpload").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      currentBars = parseCSV(text);
      setStatus(`Loaded ${currentBars.length} bars from ${file.name}.`);
    } catch (err) {
      setStatus("Could not parse CSV: " + err.message, true);
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
