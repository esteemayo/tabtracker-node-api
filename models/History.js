const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user'],
    },
    song: {
      type: mongoose.Types.ObjectId,
      ref: 'Song',
      required: [true, 'Please provide song'],
    },
  },
  { timestamps: true }
);

historySchema.pre(/^find/, function (next) {
  this.populate({
    path: 'song',
    select: 'title artist album',
  });

  next();
});

const History = mongoose.model('History', historySchema);

module.exports = History;
