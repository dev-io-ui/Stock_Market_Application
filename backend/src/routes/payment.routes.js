const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  createPaymentIntent,
  handleWebhook,
  getPaymentHistory
} = require('../controllers/payment.controller');

// Webhook route (unprotected)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.use(protect);

router.post('/create-payment-intent', createPaymentIntent);
router.get('/history', getPaymentHistory);

module.exports = router;
