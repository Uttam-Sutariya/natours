const Tour = require(`${__dirname}/../models/tourModel`);
const APIFeature = require(`${__dirname}/../utils/apiFeatures`);
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.aliasTop5Tours = (req, res, next) => {
    req.query.limit = "5";
    req.query.sort = "-ratingsAverage,price";
    req.query.fields = "name,price,ratingsAverage,summary,difficulty";
    next();
};

exports.getAllTours = catchAsync(async (req, res) => {
    // EXECUTE THE QUERY
    const feature = new APIFeature(Tour.find(), req.query)
        .filter()
        .limitFields()
        .pagination()
        .sort();

    const tours = await feature.query;

    // SEND RESPONSE
    res.status(200).json({
        status: "success",
        results: tours.length,
        data: {
            tours: tours
        }
    });
});

exports.createTour = catchAsync(async (req, res, next) => {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
        status: "success",
        data: {
            tour: newTour
        }
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.id).populate({
        path: "reviews"
        // select: "-tour"
    });
    // Tour.findOne( { _id: req.body.id } )

    if (!tour) {
        return next(new AppError("No tour found with that ID", 404));
    }

    res.status(200).send({
        status: "success",
        data: {
            tour: tour
        }
    });
});

exports.updateTour = catchAsync(async (req, res) => {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!updatedTour) {
        return next(new AppError("No tour found with that ID", 404));
    }

    res.status(200).send({
        status: "success",
        data: {
            tour: updatedTour
        }
    });
});

exports.deleteTour = catchAsync(async (req, res) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if (!tour) {
        return next(new AppError("No tour found with that ID", 404));
    }

    res.status(204).send({
        status: "success",
        Message: "Tour Deleted",
        data: null
    });
});

exports.getTourStats = catchAsync(async (req, res) => {
    const stats = await Tour.aggregate([
        {
            $match: {
                ratingsAverage: {
                    $gte: 4.5
                }
            }
        },
        {
            $group: {
                // used to define grouped by which field
                _id: "$difficulty",
                num: { $sum: 1 },
                numRatings: { $sum: "$ratingsAverage" },
                avgRating: { $avg: "$ratingsAverage" },
                avgPrice: { $avg: "$price" },
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" }
            }
        },
        {
            $sort: { minPrice: 1 }
        }
    ]);
    res.status(200).json({
        status: "success",
        data: {
            stats: stats
        }
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
    const year = +req.params.year;

    const plan = await Tour.aggregate([
        {
            $unwind: "$startDates"
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: "$startDates" },
                totalTourInThisMonth: { $sum: 1 },
                tours: { $push: "$name" }
            }
        },
        {
            $addFields: { month: "$_id" }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { totalTourInThisMonth: 1, month: 1 }
        }
    ]);

    res.status(200).json({
        status: "success",
        total: plan.length,
        data: {
            plan
        }
    });
});
