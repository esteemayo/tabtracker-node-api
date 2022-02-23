const _ = require('lodash');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { StatusCodes } = require('http-status-codes');

const User = require('../models/User');
const sendEmail = require('../utils/email');
const NotFoundError = require('../errors/notFound');
const asyncWrapper = require('../utils/asyncWrapper');
const ForbiddenError = require('../errors/forbidden');
const BadRequestError = require('../errors/badRequest');
const CustomAPIError = require('../errors/customApiError');
const UnathenticatedError = require('../errors/unauthenticated');
const createSendToken = require('../middlewares/createSendToken');

exports.login = asyncWrapper(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new BadRequestError('Please provide email and password'));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new UnathenticatedError('Incorrect email or password'));
  }

  createSendToken(user, StatusCodes.OK, req, res);
});

exports.protect = asyncWrapper(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(
      new UnathenticatedError(
        'You are not logged in! Please log in to get access'
      )
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new UnathenticatedError(
        'The user belonging to this token does no longer exist'
      )
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new UnathenticatedError(
        'User recently changed password! Please log in again'
      )
    );
  }

  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.accessToken) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.accessToken,
        process.env.JWT_SECRET
      );

      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError('You do not have permission to perform this action')
      );
    }
    next();
  };
};

exports.forgotPassword = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(
      new NotFoundError(`There is no user with email address : ${email}`)
    );
  }

  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/reset-password/${resetToken}`;

  const message = `
    Forgot your password? Submit a PATCH request with your new password and 
    confirmPassword to: ${resetURL}.\nIf you didn't forget your password, 
    please ignore this email!
  `;

  const html = `
    <h1>Hello ${user.firstName},</h1>
    <p>Forgot your password?</p>
    <p>Submit a PATCH request with your new password and confirmPassword to: ${resetURL}.</p>
    <p>If you didn't forget your password, please ignore this email!</p>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message,
      html,
    });

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Token sent to email : ${user.email}`,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new CustomAPIError(
        'There was an error sending the email. Try again later!'
      )
    );
  }
});

exports.resetPassword = asyncWrapper(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new BadRequestError('Token is invalid or has expired'));
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, StatusCodes.OK, req, res);
});

exports.updatePassword = asyncWrapper(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(req.body.passwordCurrent))) {
    return next(new UnathenticatedError('Your current password is wrong'));
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  createSendToken(user, StatusCodes.OK, req, res);
});
