# Backtest Terminal — GitHub Pages deployment

A client-side backtest dashboard for a moving-average crossover strategy.
Everything runs in the browser — no server, no API keys, no data leaves
the page. This is the right kind of "trading bot app" to host for free on
GitHub Pages, because Pages only serves static files (HTML/CSS/JS); it
cannot run a backend, so it cannot place real trades or securely hold
broker credentials. See "What this can't do" below.

## What it does

- Loads a bundled synthetic demo dataset on page load, or lets you upload
  your own OHLCV CSV (from Yahoo Finance, Stooq, or the `data_fetch.py`
  script from the Python version of this project)
- Runs a moving-average crossover strategy with adjustable fast/slow
  windows, starting capital, and stop-loss percentage
- Simulates trades bar-by-bar and shows an equity curve, performance
  metrics (total return, CAGR, Sharpe ratio, max drawdown), and a full
  trade log
- Compares the strategy against simple buy-and-hold over the same period

## Step-by-step: deploy to GitHub Pages

1. **Create a new GitHub repository.**
   Go to github.com → New repository → name it something like
   `backtest-terminal` → Create repository. Public repos get free Pages
   hosting.

2. **Upload these files to the repo.**
   Easiest way with no command line: on the repo page, click
   **"Add file" → "Upload files"**, then drag in everything from this
   folder (`index.html`, `style.css`, the `js/` folder, and the
   `sample_data/` folder), keeping the same folder structure. Commit
   directly to the `main` branch.

   (If you're comfortable with git instead:
   ```bash
   git init
   git add .
   git commit -m "Initial backtest terminal"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/backtest-terminal.git
   git push -u origin main
   ```
   )

3. **Turn on GitHub Pages.**
   In the repo, go to **Settings → Pages**. Under "Build and deployment",
   set **Source** to "Deploy from a branch", **Branch** to `main` and
   folder to `/ (root)`. Click **Save**.

4. **Wait about a minute, then visit your site.**
   GitHub will show the URL at the top of the Pages settings page — it
   will look like:
   `https://YOUR_USERNAME.github.io/backtest-terminal/`
   Open it. You should see the demo data load automatically and be able
   to click "Run backtest".

5. **Get real price data to test with.**
   The bundled demo data is synthetic (randomly generated), just so the
   page works immediately. For real data:
   - Download a CSV from Yahoo Finance (any ticker's "Historical Data"
     tab → Download), or
   - Run `python data_fetch.py AAPL 2018-01-01 2024-12-31` from the
     Python version of this project, which saves a compatible CSV, or
   - Use Stooq's CSV download for a ticker
   Then use the "Price data" file upload on the page.

6. **Every time you want to update the site**, edit the files and
   upload/commit again — Pages redeploys automatically within a minute
   or so of a push to `main`.

## Customizing

- Change the default fast/slow window values in `index.html`
  (`id="fastWindow"`, `id="slowWindow"`)
- Add more strategies by writing a new function alongside
  `movingAverageCrossover` in `js/strategy.js`, matching its input/output
  shape (array of bars in, same array with a `signal` field added, out)
- The chart in `js/chart.js` is a small dependency-free canvas renderer —
  swap in Chart.js or another library via CDN if you want more chart
  types later

## What this can't do (and why)

GitHub Pages hosts static files only. There is no server to:
- Run on a schedule (e.g. check prices every minute) — Pages doesn't
  execute code unless a browser tab is open
- Securely store broker API keys — anything in the page's JavaScript is
  publicly visible to anyone who views the page source
- Place real orders — that requires a backend that holds credentials and
  talks to a broker's API (e.g. Alpaca, Interactive Brokers)

**If you eventually want real automated execution**, the architecture
changes: you'd run a script (like the Python version of this project) on
a small always-on server or scheduled cloud function, store broker API
keys there as environment variables/secrets (never in client-side code),
and have it place trades directly. That's a meaningfully bigger step —
worth taking only after a strategy has held up in backtesting *and* an
extended period of paper trading (simulated live trading with fake
money), not before.

## A note on expectations

This dashboard makes it easy to try lots of tickers and parameter
combinations quickly — which also makes it easy to unconsciously
overfit to historical data. A parameter combination that looks great on
one ticker's history is not a discovered edge; treat any promising
result as something to test across many tickers and time periods before
trusting it at all, let alone with real money.
