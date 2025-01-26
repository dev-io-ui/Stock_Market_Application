const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/user.model');
const { AppError } = require('./error-handler.middleware');
const logger = require('../utils/logger');

exports.protect = async (req, res, next) => {
  try {
    // 1) Get token and check if it exists
    let token;
    if (
      req.headers.authorization ||
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[0];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError(401, 'Please log in to access this resource'));
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET || "abc");
    // 3) Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError(401, 'The user no longer exists'));
    }

    // 4) Check if user changed password after token was issued
    // if (user.changedPasswordAfter(decoded.iat)) {
    //   return next(new AppError(401, 'User recently changed password! Please log in again'));
    // }

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return next(new AppError(401, 'Authentication failed'));
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
};

exports.isVerified = (req, res, next) => {
  if (!req.user.emailVerified) {
    return next(new AppError(403, 'Please verify your email address to access this resource'));
  }
  next();
};

exports.isSubscribed = (req, res, next) => {
  if (req.user.subscription.type === 'free') {
    return next(new AppError(403, 'This feature requires a paid subscription'));
  }
  if (new Date() > new Date(req.user.subscription.validUntil)) {
    return next(new AppError(403, 'Your subscription has expired'));
  }
  next();
};
