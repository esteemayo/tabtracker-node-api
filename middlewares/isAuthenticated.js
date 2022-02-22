const passport = require('passport');
const ForbiddenError = require('../errors/forbidden');

module.exports = (req, res, next) => {
  passport.authenticate('jwt', (err, user) => {
    if (err || !user) {
      return next(
        new ForbiddenError('You do not have access to this resource')
      );
    }
    req.user = user;
    next();
  })(req, res, next);
};
