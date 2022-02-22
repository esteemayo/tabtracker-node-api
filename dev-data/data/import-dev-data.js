const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
require('colors');

// models
const Song = require('../../models/Song');
const User = require('../../models/User');
const History = require('../../models/History');
const Bookmark = require('../../models/Bookmark');

dotenv.config({ path: './config.env' });

// db local
const db = process.env.DATABASE_LOCAL;

// atlas mongo uri
const mongoURI = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// MongoDB connection
mongoose
  .connect(mongoURI)
  .then(() => console.log(`Connected to MongoDB → ${mongoURI}`.gray.bold))
  .catch((err) =>
    console.log(`Could not connected to MongoDB → ${err}`.red.bold)
  );

// read JSON file
const songs = JSON.parse(fs.readFileSync(`${__dirname}/songs.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const bookmarks = JSON.parse(
  fs.readFileSync(`${__dirname}/bookmarks.json`, 'utf-8')
);
const histories = JSON.parse(
  fs.readFileSync(`${__dirname}/histories.json`, 'utf-8')
);

// import data into database
const importData = async () => {
  try {
    await Song.create(songs);
    await User.create(users, { validateBeforeSave: false });
    await Bookmark.create(bookmarks);
    await History.create(histories);

    console.log('👍👍👍👍👍👍👍👍 Done!'.green.bold);
    process.exit();
  } catch (err) {
    console.log(
      '\n👎👎👎👎👎👎👎👎 Error! The Error info is below but if you are importing sample data make sure to drop the existing database first with.\n\n\t npm run blowitallaway\n\n\n'
        .red.bold
    );
    console.log(err);
    process.exit();
  }
};

// delete data from database
const deleteData = async () => {
  try {
    await Song.deleteMany();
    await User.deleteMany();
    await Bookmark.deleteMany();
    await History.deleteMany();

    console.log(
      'Data Deleted. To load sample data, run\n\n\t npm run sample\n\n'.green
        .bold
    );
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
