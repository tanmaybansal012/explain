/**
 * MONOTONIC STACK — Buy/Sell Signal Detection
 *
 * A monotonic stack is a stack that maintains elements in sorted order
 * (either strictly increasing or decreasing) at all times.
 *
 * Core insight: when we encounter a price higher than the stack top,
 * we've found a "next greater element" for the popped index.
 * This lets us answer "what is the next day the price goes higher?"
 * for EVERY day in a single O(n) pass.
 *
 * Classic O(n²) approach: for each day, scan forward to find next higher price
 * Monotonic stack: O(n) — each index is pushed once and popped once
 */

/**
 * Find local peaks and troughs in price data.
 *
 * A peak is a price higher than both its neighbors.
 * A trough is a price lower than both its neighbors.
 * These are the natural buy/sell signal points.
 *
 * @param {number[]} prices
 * @returns {{ peaks: number[], troughs: number[] }} - arrays of indices
 *
 * Time: O(n), Space: O(1) extra
 */
function findPeaksAndTroughs(prices) {
  const peaks   = [];
  const troughs = [];

  for (let i = 1; i < prices.length - 1; i++) {
    if (prices[i] > prices[i - 1] && prices[i] > prices[i + 1]) {
      peaks.push(i);
    }
    if (prices[i] < prices[i - 1] && prices[i] < prices[i + 1]) {
      troughs.push(i);
    }
  }

  return { peaks, troughs };
}

/**
 * Next Greater Element using monotonic stack.
 *
 * For each index i, finds the NEXT index j > i where prices[j] > prices[i].
 * Returns -1 if no such j exists.
 *
 * Use case: if today is a trough, when is the next good day to sell?
 *
 * @param {number[]} prices
 * @returns {number[]} nextGreater — nextGreater[i] = j, or -1
 *
 * Time: O(n), Space: O(n) for stack and output
 */
function nextGreaterElement(prices) {
  const n           = prices.length;
  const nextGreater = new Array(n).fill(-1);
  const stack       = [];   // monotone decreasing stack of indices

  for (let i = 0; i < n; i++) {
    // While top of stack has a smaller price, current price is its "next greater"
    while (stack.length && prices[stack[stack.length - 1]] < prices[i]) {
      const idx = stack.pop();
      nextGreater[idx] = i;
    }
    stack.push(i);
  }
  // Remaining indices in stack have no greater element → stay -1

  return nextGreater;
}

/**
 * Previous Greater Element using monotonic stack (reversed traversal).
 * Useful for finding resistance levels (last time price was this high).
 *
 * @param {number[]} prices
 * @returns {number[]} prevGreater — prevGreater[i] = j, or -1
 *
 * Time: O(n), Space: O(n)
 */
function prevGreaterElement(prices) {
  const n           = prices.length;
  const prevGreater = new Array(n).fill(-1);
  const stack       = [];

  for (let i = n - 1; i >= 0; i--) {
    while (stack.length && prices[stack[stack.length - 1]] < prices[i]) {
      const idx = stack.pop();
      prevGreater[idx] = i;
    }
    stack.push(i);
  }

  return prevGreater;
}

/**
 * Compute actionable buy/sell signals combining troughs, peaks,
 * and next-greater-element logic.
 *
 * Signal logic:
 *   - BUY  at a local trough where nextGreater[i] exists (confirmed upside)
 *   - SELL at a local peak where prevGreater[i] < i (confirmed resistance broken)
 *   - HOLD otherwise
 *
 * @param {number[]} prices  - closing prices, oldest first
 * @param {Date[]}   dates   - corresponding dates (optional, for output)
 * @returns {{
 *   signals:     Array<{ index, price, action, nextMoveIndex, nextMovePrice }>,
 *   peaks:       number[],
 *   troughs:     number[],
 *   nextGreater: number[],
 * }}
 */
function computeSignals(prices, dates = []) {
  if (!prices || prices.length < 3) {
    return { signals: [], peaks: [], troughs: [], nextGreater: [] };
  }

  const { peaks, troughs } = findPeaksAndTroughs(prices);
  const nextGreater        = nextGreaterElement(prices);
  const prevGreater        = prevGreaterElement(prices);

  const signals = [];

  // BUY signals: troughs with confirmed upside
  for (const i of troughs) {
    const nextUp = nextGreater[i];
    signals.push({
      index:         i,
      price:         prices[i],
      action:        'BUY',
      date:          dates[i] || null,
      nextMoveIndex: nextUp,
      nextMovePrice: nextUp !== -1 ? prices[nextUp] : null,
      expectedGain:  nextUp !== -1
        ? +((prices[nextUp] - prices[i]).toFixed(2))
        : null,
    });
  }

  // SELL signals: peaks
  for (const i of peaks) {
    const prevHigh = prevGreater[i];
    signals.push({
      index:         i,
      price:         prices[i],
      action:        'SELL',
      date:          dates[i] || null,
      prevResistance: prevHigh !== -1 ? prices[prevHigh] : null,
      strength:       prevHigh === -1 ? 'NEW_HIGH' : 'BOUNCE',
    });
  }

  // Sort chronologically
  signals.sort((a, b) => a.index - b.index);

  return { signals, peaks, troughs, nextGreater };
}

/**
 * Sliding window maximum (monotone deque).
 * Returns the maximum price in each window of size k.
 * Used for computing the "k-day high" resistance line.
 *
 * @param {number[]} prices
 * @param {number}   k
 * @returns {number[]}
 *
 * Time: O(n), Space: O(k) — classic deque trick
 */
function slidingWindowMax(prices, k) {
  if (!prices || prices.length === 0 || k <= 0) return [];

  const result = [];
  const deque  = [];   // indices, front = max of current window

  for (let i = 0; i < prices.length; i++) {
    // Remove indices outside the window
    while (deque.length && deque[0] < i - k + 1) deque.shift();

    // Remove smaller elements from back (they can never be max)
    while (deque.length && prices[deque[deque.length - 1]] < prices[i]) {
      deque.pop();
    }

    deque.push(i);

    // Window is full: record max (always at front of deque)
    if (i >= k - 1) result.push(prices[deque[0]]);
  }

  return result;
}

module.exports = {
  findPeaksAndTroughs,
  nextGreaterElement,
  prevGreaterElement,
  computeSignals,
  slidingWindowMax,
};
