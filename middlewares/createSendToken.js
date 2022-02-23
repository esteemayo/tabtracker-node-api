const createSendToken = (user, statusCode, req, res) => {
  const accessToken = user.generateAuthToken();

  res.cookie('accessToken', accessToken, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    signed: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  const { password, ...rest } = user._doc;

  res.status(statusCode).json({
    status: 'success',
    accessToken,
    user: rest,
  });
};

module.exports = createSendToken;
