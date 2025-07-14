var express = require('express');
var router = express.Router();
const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// Real fundamentals endpoint using Yahoo Finance
router.get('/api/fundamentals', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }
  try {
    // Yahoo Finance expects NSE symbols as e.g. TCS.NS, RELIANCE.NS
    const s = symbol.toUpperCase().endsWith('.NS') ? symbol.toUpperCase() : symbol.toUpperCase() + '.NS';
    const result = await yahooFinance.quoteSummary(s, { modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData'] });

    // Map Yahoo fields to your frontend format
    const mapped = {
      symbol: symbol.toUpperCase(),
      name: result.price?.longName || result.price?.shortName || symbol.toUpperCase(),
      metrics: {
        peRatio: result.summaryDetail?.trailingPE ?? null,
        roe: result.financialData?.returnOnEquity ? (result.financialData.returnOnEquity * 100).toFixed(2) : null,
        roce: null, // Not directly available
        eps: result.defaultKeyStatistics?.trailingEps ?? null,
        debtToEquity: result.financialData?.debtToEquity ?? null,
        bookValue: result.defaultKeyStatistics?.bookValue ?? null,
        promoterHolding: null, // Not available from Yahoo
        profitGrowth: result.financialData?.profitMargins ? (result.financialData.profitMargins * 100).toFixed(2) : null,
        salesGrowth: result.financialData?.revenueGrowth ? (result.financialData.revenueGrowth * 100).toFixed(2) : null,
        marketCap: result.price?.marketCap ?? null,
        priceToBook: result.defaultKeyStatistics?.priceToBook ?? null,
        dividendYield: result.summaryDetail?.dividendYield ? (result.summaryDetail.dividendYield * 100).toFixed(2) : null,
        trailingAnnualDividendRate: result.summaryDetail?.trailingAnnualDividendRate ?? null,
        trailingAnnualDividendYield: result.summaryDetail?.trailingAnnualDividendYield ? (result.summaryDetail.trailingAnnualDividendYield * 100).toFixed(2) : null,
        beta: result.summaryDetail?.beta ?? null
      }
    };
    res.json(mapped);
  } catch (err) {
    console.error('Yahoo Finance error:', err.message);
    res.status(500).json({
      error: 'Failed to fetch data from Yahoo Finance',
      details: err.message
    });
  }
});

module.exports = router;
