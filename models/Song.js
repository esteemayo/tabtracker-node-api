const mongoose = require('mongoose');
const slugify = require('slugify');

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please a song must have a title'],
    },
    slug: String,
    artist: {
      type: String,
      required: [true, 'A song must belong to an artist'],
    },
    genre: {
      type: String,
      required: [true, 'A song must have a genre'],
    },
    album: {
      type: String,
      required: [true, 'A song must belong to an album'],
    },
    albumImageUrl: String,
    youtubeId: String,
    lyrics: {
      type: String,
      required: [true, 'A song must have lyrics'],
    },
    tabs: String,
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'A song must be uploaded by a user'],
    },
  },
  {
    timestamps: true,
  }
);

songSchema.index({
  title: 'text',
  artist: 'text',
});

songSchema.index({ title: 1, artist: 1 });
songSchema.index({ album: 1, genre: 1 });
songSchema.index({ slug: 1 });

songSchema.pre('save', async function (next) {
  if (!this.isModified('title')) return next();
  this.slug = slugify(this.title, { lower: true });

  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const songWithSlug = await this.constructor.find({ slug: slugRegEx });

  if (songWithSlug.length) {
    this.slug = `${this.slug}-${songWithSlug.length + 1}`;
  }
});

const Song = mongoose.model('Song', songSchema);

module.exports = Song;
