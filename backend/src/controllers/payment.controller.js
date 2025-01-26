const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/user.model');
const { AppError } = require('../middleware/error-handler.middleware');
const logger = require('../utils/logger');

// Create payment intent
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      metadata: {
        userId: req.user._id.toString()
      }
    });

    res.status(200).json({
      status: 'success',
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    logger.error('Payment intent creation error:', error);
    next(new AppError(400, 'Failed to create payment intent'));
  }
};

// Webhook handler for Stripe events
exports.handleWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    next(new AppError(400, 'Webhook error'));
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const paymentIntents = await stripe.paymentIntents.list({
      customer: req.user.stripeCustomerId,
      limit: 10
    });

    res.status(200).json({
      status: 'success',
      data: {
        payments: paymentIntents.data
      }
    });
  } catch (error) {
    logger.error('Payment history error:', error);
    next(new AppError(400, 'Failed to fetch payment history'));
  }
};

// Helper function to handle successful payments
const handlePaymentSuccess = async (paymentIntent) => {
  try {
    const userId = paymentIntent.metadata.userId;
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Update user's subscription or course access based on the payment
    // This is just an example, modify according to your needs
    user.isPremium = true;
    user.premiumExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await user.save();

    logger.info(`Payment successful for user ${userId}`);
  } catch (error) {
    logger.error('Payment success handler error:', error);
    throw error;
  }
};

// Helper function to handle failed payments
const handlePaymentFailure = async (paymentIntent) => {
  try {
    const userId = paymentIntent.metadata.userId;
    logger.warn(`Payment failed for user ${userId}`);
    // Add any necessary failure handling logic here
  } catch (error) {
    logger.error('Payment failure handler error:', error);
    throw error;
  }
};
