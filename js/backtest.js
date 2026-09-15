/**
 * backtest.js
 *
 * Simulates trading a single ticker using signals from strategy.js.
 * Mirrors the Python backtest.py logic: stop-loss enforcement,
 * commission cost, and standard performance metrics.
 */

function applyStopLoss(entryPrice, stopLossPct) {
  return entryPrice * (1 - stopLossPct);
}

function runBacktest(bars, opts) {
  const {
    initialCapital = 10000,
    commissionPct = 0.001,
    stopLossPct = 0.05,
  } = opts || {};

  let cash = initialCapital;
  let shares = 0;
  let stopPrice = null;

  const equityCurve = [];
  const trades = [];

  for (const bar of bars) {
    const price = bar.close;
    const signal = bar.signal;

    if (shares > 0 && price <= stopPrice) {
      const proceeds = shares * price * (1 - commissionPct);
      cash += proceeds;
      trades.push({ date: bar.date, action: "STOP_LOSS_SELL", price, shares, cashAfter: cash });
      shares = 0;
      stopPrice = null;
    } else if (signal === 1 && shares === 0) {
      const sharesToBuy = Math.floor(cash / (price * (1 + commissionPct)));
      if (sharesToBuy > 0) {
        const cost = sharesToBuy * price * (1 + commissionPct);
        cash -= cost;
        shares = sharesToBuy;
        stopPrice = applyStopLoss(price, stopLossPct);
        trades.push({ date: bar.date, action: "BUY", price, shares, cashAfter: cash });
      }
    } else if (signal === 0 && shares > 0) {
      const proceeds = shares * price * (1 - commissionPct);
      cash += proceeds;
      trades.push({ date: bar.date, action: "SELL", price, shares, cashAfter: cash });
      shares = 0;
      stopPrice = null;
    }

    equityCurve.push({ date: bar.date, equity: cash + shares * price });
  }

  const metrics = computeMetrics(equityCurve, initialCapital);
  return { equityCurve, trades, metrics };
}

function computeMetrics(equityCurve, initialCapital) {
  const equity = equityCurve.map((e) => e.equity);
  const n = equity.length;
  const finalEquity = equity[n - 1];

  const totalReturnPct = (finalEquity / initialCapital - 1) * 100;

  const dailyReturns = [];
  for (let i = 1; i < n; i++) {
    dailyReturns.push(equity[i] / equity[i - 1] - 1);
  }
  const years = n / 252;
  const cagrPct = years > 0 ? (Math.pow(finalEquity / initialCapital, 1 / years) - 1) * 100 : 0;

  const mean = dailyReturns.reduce((a, b) => a + b, 0) / (dailyReturns.length || 1);
  const variance =
    dailyReturns.reduce((a, b) => a + (b - mean) ** 2, 0) / (dailyReturns.length || 1);
  const std = Math.sqrt(variance);
  const sharpe = std > 0 ? (mean / std) * Math.sqrt(252) : 0;

  let peak = -Infinity;
  let maxDrawdownPct = 0;
  for (const e of equity) {
    if (e > peak) peak = e;
    const dd = ((e - peak) / peak) * 100;
    if (dd < maxDrawdownPct) maxDrawdownPct = dd;
  }

  return {
    totalReturnPct: round2(totalReturnPct),
    cagrPct: round2(cagrPct),
    sharpeRatio: round2(sharpe),
    maxDrawdownPct: round2(maxDrawdownPct),
    finalEquity: round2(finalEquity),
  };
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

if (typeof module !== "undefined") {
  module.exports = { runBacktest, computeMetrics, applyStopLoss };
}
