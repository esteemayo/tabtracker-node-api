const express = require('express');

const authController = require('../controllers/authController');
// const isAuthenticated = require('../middlewares/isAuthenticated');
const bookmarkController = require('../controllers/bookmarkController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(bookmarkController.getAllBookmark)
  .post(bookmarkController.createBookmark);

router
  .route('/:id')
  .get(bookmarkController.getBookmark)
  .patch(bookmarkController.updateBookmark)
  .delete(bookmarkController.deleteBookmark);

router.get('/song/:songId', bookmarkController.getOneBookmark);

module.exports = router;
