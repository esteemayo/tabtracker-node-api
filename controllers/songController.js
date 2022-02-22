const { StatusCodes } = require('http-status-codes');

const Song = require('../models/Song');
const NotFoundError = require('../errors/notFound');
const asyncWrapper = require('../utils/asyncWrapper');

exports.getAllSongs = asyncWrapper(async (req, res, next) => {
  let songs;
  const { search } = req.query;

  if (search) {
    songs = await Song.find().where({
      $or: ['title', 'artist', 'genre', 'album'].map((item) => ({
        [item]: search,
      })),
    });
  } else {
    songs = await Song.find().sort('-createdAt');
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    nbHits: songs.length,
    requestedAt: req.requestTime,
    songs,
  });
});

exports.getSongById = asyncWrapper(async (req, res, next) => {
  const { id: songID } = req.params;

  const song = await Song.findById(songID);

  if (!song) {
    return next(new NotFoundError(`No song found with that ID : ${songID}`));
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    song,
  });
});

exports.getSongBySlug = asyncWrapper(async (req, res, next) => {
  const { slug } = req.params;

  const song = await Song.findOne({ slug });

  if (!song) {
    return next(new NotFoundError(`No song found with that SLUG : ${slug}`));
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    song,
  });
});

exports.createSong = asyncWrapper(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user.id;

  const song = await Song.create({ ...req.body });

  res.status(StatusCodes.CREATED).json({
    status: 'success',
    song,
  });
});

exports.updateSong = asyncWrapper(async (req, res, next) => {
  const {
    user: { id: userID },
    params: { id: songID },
  } = req;

  let song = await Song.findById(songID);

  if (!song) {
    return next(new NotFoundError(`No song found with that ID : ${songID}`));
  }

  song = await Song.findByIdAndUpdate(
    songID,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  res.status(StatusCodes.OK).json({
    status: 'success',
    song,
  });
});

exports.deleteSong = asyncWrapper(async (req, res, next) => {
  const {
    user: { id: userID },
    params: { id: songID },
  } = req;

  let song = await Song.findById(songID);

  if (!song) {
    return next(new NotFoundError(`No song found with that ID : ${songID}`));
  }

  song = await Song.findOneAndDelete({
    _id: songID,
    user: userID,
  });

  res.status(StatusCodes.NO_CONTENT).json({
    status: 'success',
    song: null,
  });
});

exports.searchSongs = asyncWrapper(async (req, res, next) => {
  const songs = await Song.find(
    {
      $text: {
        $search: req.query.q,
      },
    },
    {
      score: { $meta: 'textScore' },
    }
  )
    .sort({
      score: { $meta: 'textScore' },
    })
    .limit(5);

  res.status(StatusCodes.OK).json({
    status: 'success',
    songs,
  });
});
