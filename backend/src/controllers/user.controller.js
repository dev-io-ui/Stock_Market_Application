const User = require('../models/user.model');
const { AppError } = require('../middleware/error-handler.middleware');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/email.service');
const dotenv = require("dotenv");
dotenv.config();

// Generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "abc", {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Create and send token response
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 || 7
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// Register new user
exports.register = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role || 'user'
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    newUser.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    
    await newUser.save();

    // Send verification email
    const verificationURL = `${req.protocol}://${req.get(
      'host'
    )}/api/users/verify-email/${verificationToken}`;

    await emailService.sendEmail({
      email: newUser.email,
      subject: 'Please verify your email',
      template: 'emailVerification',
      data: {
        name: newUser.name,
        url: verificationURL
      }
    });

    createSendToken(newUser, 201, res);
  } catch (error) {
    logger.error('Registration error:', error);
    next(new AppError(400, 'Failed to register user'));
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError(400, 'Please provide email and password'));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError(401, 'Incorrect email or password'));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    logger.error('Login error:', error);
    next(new AppError(400, 'Failed to login'));
  }
};

// Logout user
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

// Verify email
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken
    });

    if (!user) {
      return next(new AppError(400, 'Token is invalid or has expired'));
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully'
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    next(new AppError(400, 'Failed to verify email'));
  }
};

// Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError(404, 'No user found with that email address'));
    }

    const resetToken = user.createPasswordResetToken();
    await user.save();

    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/users/reset-password/${resetToken}`;

    await emailService.sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      template: 'passwordReset',
      data: {
        name: user.name,
        url: resetURL
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset token sent to email'
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    next(new AppError(400, 'Failed to send password reset email'));
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError(400, 'Token is invalid or has expired'));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    logger.error('Reset password error:', error);
    next(new AppError(400, 'Failed to reset password'));
  }
};

// Update password
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.comparePassword(req.body.currentPassword))) {
      return next(new AppError(401, 'Current password is incorrect'));
    }

    user.password = req.body.newPassword;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    logger.error('Update password error:', error);
    next(new AppError(400, 'Failed to update password'));
  }
};

// Get current user
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('badges')
      .populate('completedCourses.course');

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('Get user error:', error);
    next(new AppError(400, 'Failed to get user details'));
  }
};

// Update current user
exports.updateMe = async (req, res, next) => {
  try {
    if (req.body.password) {
      return next(new AppError(400, 'This route is not for password updates'));
    }

    const filteredBody = filterObj(req.body, 
      'name', 'email', 'profilePicture', 'bio', 'interests'
    );

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    logger.error('Update user error:', error);
    next(new AppError(400, 'Failed to update user'));
  }
};

// Delete current user
exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    next(new AppError(400, 'Failed to delete user'));
  }
};

// Admin: Get all users
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    next(new AppError(400, 'Failed to get users'));
  }
};

// Admin: Get single user
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError(404, 'User not found'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('Get user error:', error);
    next(new AppError(400, 'Failed to get user'));
  }
};

// Admin: Update user
exports.updateUser = async (req, res, next) => {
  try {
    // Do not allow password updates with this route
    if (req.body.password || req.body.passwordConfirm) {
      return next(new AppError(400, 'This route is not for password updates. Please use /update-password'));
    }

    const filteredBody = filterObj(req.body, 'name', 'email', 'role');
    const user = await User.findByIdAndUpdate(req.params.id, filteredBody, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return next(new AppError(404, 'User not found'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('Update user error:', error);
    next(new AppError(400, 'Failed to update user'));
  }
};

// Admin: Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(new AppError(404, 'User not found'));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    next(new AppError(400, 'Failed to delete user'));
  }
};

// Helper function to filter object
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
