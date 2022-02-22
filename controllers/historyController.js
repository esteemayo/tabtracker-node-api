const _ = require('lodash');
const { StatusCodes } = require('http-status-codes');

const History = require('../models/History');
const APIFeatures = require('../utils/apiFeatures');
const NotFoundError = require('../errors/notFound');
const asyncWrapper = require('../utils/asyncWrapper');

exports.getAllHistory = asyncWrapper(async (req, res, next) => {
  const features = new APIFeatures(
    History.find({ user: req.user.id }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  let histories = await features.query;
  histories = _.uniq(histories.map((item) => item.song));
  // const unique = _.uniqBy(allHistories, (item) => item.song);

  res.status(StatusCodes.OK).json({
    status: 'success',
    nhHits: histories.length,
    requestedAt: req.requestTime,
    histories,
  });
});

exports.getHistory = asyncWrapper(async (req, res, next) => {
  const { id: historyID } = req.params;

  const history = await History.findById(historyID);

  if (!history) {
    return next(
      new NotFoundError(`No history found with that ID → ${historyID}`)
    );
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    history,
  });
});

exports.createHistory = asyncWrapper(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user.id;

  const history = await History.create({ ...req.body });

  res.status(StatusCodes.CREATED).json({
    status: 'success',
    history,
  });
});

exports.updateHistory = asyncWrapper(async (req, res, next) => {
  const { id: historyID } = req.params;

  const history = await History.findByIdAndUpdate(
    historyID,
    { $set: req.body },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!history) {
    return next(
      new NotFoundError(`No history found with that ID → ${historyID}`)
    );
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    history,
  });
});

exports.deleteHistory = asyncWrapper(async (req, res, next) => {
  const { id: historyID } = req.params;

  const history = await History.findByIdAndDelete(historyID);

  if (!history) {
    return next(
      new NotFoundError(`No history found with that ID → ${historyID}`)
    );
  }

  res.status(StatusCodes.NO_CONTENT).json({
    status: 'success',
    history,
  });
});
