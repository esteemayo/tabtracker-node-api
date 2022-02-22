const express = require('express');

const authController = require('../controllers/authController');
const historyController = require('../controllers/historyController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(historyController.getAllHistory)
  .post(historyController.createHistory);

router
  .route('/:id')
  .get(historyController.getHistory)
  .patch(authController.restrictTo('admin'), historyController.updateHistory)
  .delete(authController.restrictTo('admin'), historyController.deleteHistory);

module.exports = router;
