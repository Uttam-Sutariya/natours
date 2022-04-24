const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

const app = express();

// Routers
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");

// 1) Middlewares

/* set security HTTP headers */
app.use(helmet());

/* log the request details to the console */
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

/* 
    limit request from same IP
    it will allow 100 request from same IP in 1 hour 
*/
const limiter = rateLimit({
    max: 100, // maximum request allowed
    windowMs: 60 * 60 * 1000, // time in milliseconds
    message: "Too many request from this IP, please try again in an hour"
});

app.use("/api", limiter);

/* 
    Body parser, reading data from body into req.body
    express.json() is middleware to add data to the request body
    This is necessary to access req.body part in application otherwise req.body = undefined
    we can also set body limit
*/
app.use(express.json({ limit: "10kb" }));

/* Data sanitization against NoSQL query injection */
app.use(mongoSanitize());

/* Data sanitization against XSS(cross site scripting) */
app.use(xss());

/* preventing parameter pollution */
app.use(
    hpp({
        whitelist: [
            "duration",
            "ratingsQuantity",
            "ratingsAverage",
            "maxGroupSize",
            "difficulty",
            "price"
        ]
    })
);

/* serving static files using built-in express middleware */
app.use(express.static(`${__dirname}/public`));

// 2) Routes

/* using router as middleware */
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

/* For unavailable routes */
app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

/* 
    error handling middleware
    express will automatically knows that it's global error handling function as it take error as first parameter
*/
app.use(globalErrorHandler);

module.exports = app;
