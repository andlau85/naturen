const express = require('express');
const authController = require('./../controllers/authController');
const reviewController = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });

// Protected (login)
router.use(authController.protect);

router
   .route('/')
   .get(reviewController.getAllReviews)
   .post(
      authController.restrictTo('user'),
      reviewController.setTourUserIds,
      reviewController.createReview
   );

// router.route('/:id').get(reviewController.getReview);

router
   .route('/:id')
   .get(reviewController.getReview)
   .patch(
      authController.restrictTo('user', 'admin'),
      reviewController.updateReview
   )
   .delete(
      authController.restrictTo('user', 'admin'),
      reviewController.deleteReview
   );

module.exports = router;

//----------------- NESTED ROUTES.-------------------//
// GET /api/v1/tours/61122f7de06f2332ac44b5e9/reviews
// App.js /api/v1/tours/ -> toursRouter /:tourId/reviews -> reviewRouter /
