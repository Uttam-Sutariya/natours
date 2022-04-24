const express = require("express");
const authControllter = require("../controllers/authController");
const tourController = require("../controllers/tourController");

const router = express.Router();

// router.param("id", tourController.checkId);
router
    .route("/top-5-cheap")
    .get(tourController.aliasTop5Tours, tourController.getAllTours);

router.route("/tour-stats").get(tourController.getTourStats);
router.route("/monthly-plan/:year").get(tourController.getMonthlyPlan);

router
    .route("/")
    .get(authControllter.protect, tourController.getAllTours)
    .post(tourController.createTour);

router
    .route("/:id")
    .get(tourController.getTour)
    .patch(tourController.updateTour)
    .delete(
        authControllter.protect,
        authControllter.restictTo("admin", "lead-guide"),
        tourController.deleteTour
    );

module.exports = router;
