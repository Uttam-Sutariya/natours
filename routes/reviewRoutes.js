const express = require("express");
const reviewController = require("./../controllers/reviewController");
const authController = require("./../controllers/authController");

const router = express.Router();

router
    .route("/")
    .get(reviewController.getAllReviews)
    .post(
        authController.protect,
        authController.restictTo("user", "admin", "guide", "lead-guide"),
        reviewController.createReview
    );

module.exports = router;
