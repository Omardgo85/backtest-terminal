/**
 * chart.js
 *
 * Minimal dependency-free line chart renderer using <canvas>.
 * Not a general-purpose charting library - just enough to plot an
 * equity curve (optionally with a second comparison line) with axis
 * labels and a legend.
 */

function drawLineChart(canvas, series, opts) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const padding = { top: 20, right: 20, bottom: 30, left: 70 };
  const plotW = cssWidth - padding.left - padding.right;
  const plotH = cssHeight - padding.top - padding.bottom;

  const allValues = series.flatMap((s) => s.values);
  const minY = Math.min(...allValues);
  const maxY = Math.max(...allValues);
  const yRange = maxY - minY || 1;

  const n = series[0].values.length;

  const xForIndex = (i) => padding.left + (i / (n - 1)) * plotW;
  const yForValue = (v) => padding.top + plotH - ((v - minY) / yRange) * plotH;

  // Axes
  ctx.strokeStyle = "#ddd";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + plotH);
  ctx.lineTo(padding.left + plotW, padding.top + plotH);
  ctx.stroke();

  // Y-axis labels (5 ticks)
  ctx.fillStyle = "#666";
  ctx.font = "11px -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const ticks = 5;
  for (let t = 0; t <= ticks; t++) {
    const v = minY + (yRange * t) / ticks;
    const y = yForValue(v);
    ctx.fillText(formatNumber(v, opts.yFormat), padding.left - 8, y);
    ctx.strokeStyle = "#f0f0f0";
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + plotW, y);
    ctx.stroke();
  }

  // X-axis labels (start, mid, end dates)
  if (opts.xLabels) {
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const idxs = [0, Math.floor((n - 1) / 2), n - 1];
    for (const i of idxs) {
      ctx.fillText(opts.xLabels[i], xForIndex(i), padding.top + plotH + 8);
    }
  }

  // Lines
  series.forEach((s) => {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    s.values.forEach((v, i) => {
      const x = xForIndex(i);
      const y = yForValue(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  // Legend
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  let legendX = padding.left + 10;
  series.forEach((s) => {
    ctx.fillStyle = s.color;
    ctx.fillRect(legendX, padding.top - 14, 10, 10);
    ctx.fillStyle = "#333";
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText(s.label, legendX + 14, padding.top - 9);
    legendX += ctx.measureText(s.label).width + 40;
  });
}

function formatNumber(v, fmt) {
  if (fmt === "currency") return "$" + Math.round(v).toLocaleString();
  return Math.round(v).toString();
}

if (typeof module !== "undefined") {
  module.exports = { drawLineChart };
}
