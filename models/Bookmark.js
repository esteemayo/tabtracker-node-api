const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
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

bookmarkSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'song',
    select: 'title artist',
  });

  next();
});

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

module.exports = Bookmark;
