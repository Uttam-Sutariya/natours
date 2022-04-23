const AppError = require("../utils/appError");

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;

    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const value = err.message.match(/(["'])(\\?.)*?\1/)[0];

    const message = `Duplicate field value: ${value}`;

    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);

    const message = `Invalid input data. ${errors.join(". ")}`;
    return new AppError(message, 400);
};

const handleJWTError = () =>
    new AppError("Invalid token. Please login again", 401);

const handleTokenExpiredError = () =>
    new AppError("Your token has expired. Login again", 401);

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        stack: err.stack,
        message: err.message
    });
};

const sendErrorProd = (err, res) => {
    // operational error
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
        // Programming or other unknown error: don't leak error details
    } else {
        // 1) log error

        console.log("Error 💥", err);

        // 2) Send error
        res.status(500).json({
            status: "error",
            message: "Something went wrong !"
        });
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (process.env.NODE_ENV === "development") {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === "production") {
        if (err.name === "CastError") err = handleCastErrorDB(err);
        if (err.code === 11000) err = handleDuplicateFieldsDB(err);
        if (err.name === "ValidationError") err = handleValidationErrorDB();
        if (err.name === "JsonWebTokenError") err = handleJWTError();
        if (err.name === "TokenExpiredError")
            err = handleTokenExpiredError(err);

        sendErrorProd(err, res);
    }
};
