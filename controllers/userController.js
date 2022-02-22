const _ = require('lodash');
const { StatusCodes } = require('http-status-codes');

const User = require('../models/User');
const Song = require('../models/Song');
const History = require('../models/History');
const Bookmark = require('../models/Bookmark');
const asyncWrapper = require('../utils/asyncWrapper');
const BadRequestError = require('../errors/badRequest');
const factory = require('../controllers/handlerFactory');
const createSendToken = require('../middlewares/createSendToken');

exports.register = asyncWrapper(async (req, res, next) => {
  const userInputs = _.pick(req.body, [
    'name',
    'role',
    'email',
    'password',
    'confirmPassword',
    'passwordChangedAt',
  ]);

  const user = await User.create({ ...userInputs });

  createSendToken(user, StatusCodes.CREATED, res);
});

exports.updateMe = asyncWrapper(async (req, res, next) => {
  const { password, confirmPassword } = req.body;

  if (password || confirmPassword) {
    return next(
      new BadRequestError(
        `his route is not for password updates. Please use update ${
          req.protocol
        }://${req.get('host')}/api/v1/auth/update-my-password`
      )
    );
  }

  const filterBody = _.pick(req.body, ['name', 'email']);

  const updUser = await User.findByIdAndUpdate(
    req.user.id,
    { $set: filterBody },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(StatusCodes.OK).json({
    status: 'success',
    user: updUser,
  });
});

exports.deleteMe = asyncWrapper(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, { active: false });

  await Song.deleteMany({ user: user.id });
  await History.deleteMany({ user: user.id });
  await Bookmark.deleteMany({ user: user.id });

  res.status(StatusCodes.NO_CONTENT).json({
    status: 'success',
    user: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.createUser = (req, res) => {
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: 'fail',
    message: `This route is not defined! Please use ${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/register instead`,
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOneById(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
