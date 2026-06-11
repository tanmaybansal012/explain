const Portfolio   = require('../models/Portfolio');
const PriceHistory = require('../models/PriceHistory');

/**
 * Enrich portfolio holdings with current prices and P&L.
 * Fetches latest prices in a SINGLE aggregation (not N queries).
 */
async function enrichPortfolio(portfolio) {
  const tickers     = portfolio.getTickers();
  const priceMap    = await PriceHistory.getLatestPrices(tickers);

  const enrichedHoldings = portfolio.holdings.map(h => {
    const currentPrice   = priceMap[h.ticker] || null;
    const unrealizedPnL  = currentPrice
      ? +((currentPrice - h.avgBuyPrice) * h.quantity).toFixed(2)
      : null;
    const pnlPercent     = currentPrice
      ? +(((currentPrice - h.avgBuyPrice) / h.avgBuyPrice) * 100).toFixed(2)
      : null;
    const currentValue   = currentPrice
      ? +(currentPrice * h.quantity).toFixed(2)
      : null;
    const costBasis      = +(h.avgBuyPrice * h.quantity).toFixed(2);

    return {
      _id:          h._id,
      ticker:       h.ticker,
      quantity:     h.quantity,
      avgBuyPrice:  h.avgBuyPrice,
      boughtAt:     h.boughtAt,
      currentPrice,
      costBasis,
      currentValue,
      unrealizedPnL,
      pnlPercent,
    };
  });

  // Portfolio-level totals
  const totalCost  = enrichedHoldings.reduce((s, h) => s + h.costBasis, 0);
  const totalValue = enrichedHoldings.reduce((s, h) => s + (h.currentValue || h.costBasis), 0);
  const totalPnL   = +(totalValue - totalCost).toFixed(2);
  const totalPnLPct = totalCost > 0
    ? +(((totalValue - totalCost) / totalCost) * 100).toFixed(2)
    : 0;

  return {
    _id:       portfolio._id,
    userId:    portfolio.userId,
    name:      portfolio.name,
    holdings:  enrichedHoldings,
    summary: {
      totalCost:    +totalCost.toFixed(2),
      totalValue:   +totalValue.toFixed(2),
      totalPnL,
      totalPnLPct,
      holdingsCount: enrichedHoldings.length,
    },
    createdAt: portfolio.createdAt,
    updatedAt: portfolio.updatedAt,
  };
}

/**
 * Compute daily P&L history for a portfolio over N days.
 * Used for the portfolio performance chart.
 */
async function portfolioPnLHistory(portfolio, days = 30) {
  const tickers  = portfolio.getTickers();
  const since    = new Date();
  since.setDate(since.getDate() - days);

  // Fetch all price history for all tickers in one query
  const allHistory = await PriceHistory.find({
    ticker:    { $in: tickers },
    timestamp: { $gte: since },
  }).sort({ timestamp: 1 }).lean();

  // Group by date string
  const byDate = {};
  for (const record of allHistory) {
    const dateKey = record.timestamp.toISOString().split('T')[0];
    if (!byDate[dateKey]) byDate[dateKey] = {};
    byDate[dateKey][record.ticker] = record.close;
  }

  // For each date, compute total portfolio value
  const series = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, prices]) => {
      let totalValue = 0;
      let totalCost  = 0;
      for (const h of portfolio.holdings) {
        const price = prices[h.ticker] || h.avgBuyPrice;
        totalValue += price * h.quantity;
        totalCost  += h.avgBuyPrice * h.quantity;
      }
      return {
        date,
        totalValue: +totalValue.toFixed(2),
        totalCost:  +totalCost.toFixed(2),
        pnl:        +(totalValue - totalCost).toFixed(2),
      };
    });

  return series;
}

module.exports = { enrichPortfolio, portfolioPnLHistory };
