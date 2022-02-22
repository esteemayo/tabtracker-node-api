const express = require('express');

const authController = require('../controllers/authController');
const songController = require('../controllers/songController');

const router = express.Router();

router.get('/detail/:slug', songController.getSongBySlug);

router.get('/search', songController.searchSongs);

router
  .route('/')
  .get(songController.getAllSongs)
  .post(authController.protect, songController.createSong);

router
  .route('/:id')
  .get(songController.getSongById)
  .patch(authController.protect, songController.updateSong)
  .delete(authController.protect, songController.deleteSong);

module.exports = router;
