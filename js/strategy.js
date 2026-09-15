/**
 * strategy.js
 *
 * Moving-average crossover signal generator. Mirrors the logic in the
 * Python version (strategy.py) so results are directly comparable.
 *
 * Input: array of bars, each { date, open, high, low, close, volume }
 *        sorted oldest -> newest.
 * Output: same array, with fastMA, slowMA, and signal (0/1) added.
 *         signal is shifted by one bar to avoid lookahead bias - the
 *         signal on bar i reflects what we decide to hold going INTO bar i,
 *         based on information available at the close of bar i-1.
 */

function simpleMovingAverage(values, window) {
  const out = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= window) sum -= values[i - window];
    if (i >= window - 1) out[i] = sum / window;
  }
  return out;
}

function movingAverageCrossover(bars, fastWindow, slowWindow) {
  if (fastWindow >= slowWindow) {
    throw new Error("fastWindow must be smaller than slowWindow");
  }

  const closes = bars.map((b) => b.close);
  const fastMA = simpleMovingAverage(closes, fastWindow);
  const slowMA = simpleMovingAverage(closes, slowWindow);

  // Raw signal: 1 if fastMA > slowMA (both defined), else 0
  const rawSignal = bars.map((_, i) => {
    if (fastMA[i] === null || slowMA[i] === null) return 0;
    return fastMA[i] > slowMA[i] ? 1 : 0;
  });

  // Shift by 1 bar to avoid lookahead bias
  const signal = rawSignal.map((_, i) => (i === 0 ? 0 : rawSignal[i - 1]));

  return bars.map((bar, i) => ({
    ...bar,
    fastMA: fastMA[i],
    slowMA: slowMA[i],
    signal: signal[i],
  }));
}

if (typeof module !== "undefined") {
  module.exports = { movingAverageCrossover, simpleMovingAverage };
}
