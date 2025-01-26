const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  createPortfolio,
  getPortfolios,
  getPortfolio,
  executeTrade,
  getPortfolioPerformance,
  addToWatchlist,
  removeFromWatchlist
} = require('../controllers/virtual-trading.controller');

// All routes are protected
router.use(protect);

router
  .route('/portfolio')
  .post(createPortfolio)
  .get(getPortfolios);

router
  .route('/portfolio/:id')
  .get(getPortfolio);

router.get('/portfolio/:id/performance', getPortfolioPerformance);

router.post('/trade', executeTrade);

router
  .route('/watchlist')
  .post(addToWatchlist);

router
  .route('/watchlist/:portfolioId/:symbol')
  .delete(removeFromWatchlist);

module.exports = router;
