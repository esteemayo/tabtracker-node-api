const { StatusCodes } = require('http-status-codes');

const Bookmark = require('../models/Bookmark');
const APIFeatures = require('../utils/apiFeatures');
const NotFoundError = require('../errors/notFound');
const asyncWrapper = require('../utils/asyncWrapper');
const ForbiddenError = require('../errors/forbidden');
const BadRequestError = require('../errors/badRequest');

exports.getAllBookmark = asyncWrapper(async (req, res, next) => {
  const features = new APIFeatures(
    Bookmark.find({ user: req.user.id }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const bookmarks = await features.query;

  res.status(StatusCodes.OK).json({
    status: 'success',
    nbHits: bookmarks.length,
    requestedAt: req.requestTime,
    bookmarks,
  });
});

exports.getBookmark = asyncWrapper(async (req, res, next) => {
  const {
    user: { id: userID },
    params: { id: bookmarkID },
  } = req;

  const bookmark = await Bookmark.findOne({
    _id: bookmarkID,
    user: userID,
  });

  if (!bookmark) {
    return next(
      new NotFoundError(`No bookmark found with that ID : ${bookmarkID}`)
    );
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    bookmark,
  });
});

exports.getOneBookmark = asyncWrapper(async (req, res, next) => {
  const {
    user: { id: userID },
    params: { songId },
  } = req;

  const bookmark = await Bookmark.findOne({
    user: userID,
    song: songId,
  });

  if (!bookmark) {
    return next(
      new NotFoundError(
        `No bookmark found with that IDs : ${userID} & ${songId}`
      )
    );
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    bookmark,
  });
});

exports.createBookmark = asyncWrapper(async (req, res, next) => {
  const { song } = req.body;

  let bookmark = await Bookmark.findOne({ user: req.user.id, song });

  if (bookmark) {
    return next(new BadRequestError('You already have this set as a bookmark'));
  }

  if (!req.body.user) req.body.user = req.user.id;

  bookmark = await Bookmark.create({ ...req.body });

  res.status(StatusCodes.CREATED).json({
    status: 'success',
    bookmark,
  });
});

exports.updateBookmark = asyncWrapper(async (req, res, next) => {
  const {
    user: { id: userID },
    params: { id: bookmarkID },
  } = req;

  const bookmark = await Bookmark.findOneAndUpdate(
    {
      user: userID,
      song: bookmarkID,
    },
    { $set: req.body },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!bookmark) {
    return next(
      new NotFoundError(`No bookmark found with that ID : ${bookmarkID}`)
    );
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    bookmark,
  });
});

exports.deleteBookmark = asyncWrapper(async (req, res, next) => {
  const {
    user: { id: userID },
    params: { id: bookmarkID },
  } = req;

  const bookmark = await Bookmark.findOneAndDelete({
    _id: bookmarkID,
    user: userID,
  });

  if (!bookmark) {
    return next(new ForbiddenError('You do not have access to this bookmark'));
  }

  res.status(StatusCodes.NO_CONTENT).json({
    status: 'success',
    bookmark: null,
  });
});
