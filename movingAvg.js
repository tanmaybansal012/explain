/**
 * SLIDING WINDOW — Moving Average & Crossover Signals
 *
 * Problem: Given an array of closing prices, compute the k-day
 * moving average for every day. Detect crossover signals.
 *
 * Naive approach: for each index i, sum prices[i-k+1..i] → O(n·k)
 * Sliding window: maintain a running sum, add new price, drop oldest → O(n)
 *
 * Why this matters here:
 *   - We compute MA for every ticker every 5 minutes in the background job
 *   - With 500 tickers × 365 days × k=30, O(n·k) is ~5.5M ops per run
 *   - Sliding window cuts this to ~183K ops — 30× faster
 */

/**
 * Compute k-day moving average using sliding window.
 * @param {number[]} prices  - Array of closing prices (oldest first)
 * @param {number}   k       - Window size (e.g. 7 for 7-day MA)
 * @returns {{ index: number, ma: number }[]}
 *
 * Time:  O(n)   — single pass, constant work per element
 * Space: O(n)   — output array (input not mutated)
 */
function movingAverage(prices, k) {
  if (!prices || prices.length === 0) return [];
  if (k <= 0 || k > prices.length)   return [];

  const result = [];

  // Bootstrap: sum the first window
  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += prices[i];
  result.push({ index: k - 1, ma: +(windowSum / k).toFixed(4) });

  // Slide: remove leftmost element, add rightmost
  for (let i = k; i < prices.length; i++) {
    windowSum += prices[i] - prices[i - k];   // O(1) per step
    result.push({ index: i, ma: +(windowSum / k).toFixed(4) });
  }

  return result;
}

/**
 * Detect MA crossover signals.
 * A "buy" signal fires when price crosses ABOVE the MA (bullish momentum).
 * A "sell" signal fires when price crosses BELOW the MA (bearish momentum).
 *
 * @param {number[]} prices - Closing prices
 * @param {number}   k      - MA window size
 * @returns {{ buys: number[], sells: number[], ma: number[] }}
 *   buys/sells are indices where the signal fires
 */
function crossoverSignals(prices, k) {
  const maData = movingAverage(prices, k);
  if (maData.length === 0) return { buys: [], sells: [], ma: [] };

  // Align: ma[i] corresponds to prices[i] (null before window fills)
  const ma = new Array(prices.length).fill(null);
  maData.forEach(({ index, ma: val }) => { ma[index] = val; });

  const buys  = [];
  const sells = [];

  for (let i = k; i < prices.length; i++) {
    if (ma[i] === null || ma[i - 1] === null) continue;

    const prevAbove = prices[i - 1] >= ma[i - 1];
    const currAbove = prices[i]     >= ma[i];

    if (!prevAbove && currAbove) buys.push(i);   // crossed above → buy
    if (prevAbove  && !currAbove) sells.push(i); // crossed below → sell
  }

  return { buys, sells, ma };
}

/**
 * Compute multiple MAs at once (e.g. 7-day, 21-day, 50-day).
 * Reuses movingAverage — clean, testable, DRY.
 *
 * @param {number[]} prices
 * @param {number[]} windows - e.g. [7, 21, 50]
 * @returns {Object} keyed by window size
 */
function multipleMovingAverages(prices, windows = [7, 21, 50]) {
  const result = {};
  for (const k of windows) {
    result[`ma${k}`] = movingAverage(prices, k);
  }
  return result;
}

/**
 * Maximum subarray gain (Kadane's variant for stock profit).
 * Finds the single best buy-then-sell window.
 *
 * @param {number[]} prices
 * @returns {{ maxGain: number, buyIndex: number, sellIndex: number }}
 *
 * Time: O(n), Space: O(1)
 */
function bestBuySell(prices) {
  if (!prices || prices.length < 2) return { maxGain: 0, buyIndex: -1, sellIndex: -1 };

  let minPrice   = prices[0];
  let minIndex   = 0;
  let maxGain    = 0;
  let buyIndex   = 0;
  let sellIndex  = 0;

  for (let i = 1; i < prices.length; i++) {
    const gain = prices[i] - minPrice;
    if (gain > maxGain) {
      maxGain   = gain;
      buyIndex  = minIndex;
      sellIndex = i;
    }
    if (prices[i] < minPrice) {
      minPrice = prices[i];
      minIndex = i;
    }
  }

  return {
    maxGain:    +maxGain.toFixed(2),
    maxGainPct: minPrice > 0 ? +((maxGain / minPrice) * 100).toFixed(2) : 0,
    buyIndex,
    sellIndex,
  };
}

module.exports = { movingAverage, crossoverSignals, multipleMovingAverages, bestBuySell };
