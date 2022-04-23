const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const filterObj = (obj, ...allowdFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowdFields.includes(el)) {
            newObj[el] = obj[el];
        }
    });

    return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
    // 1] create error if user try to update password
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                "Please use /updatePassword route to change password",
                400
            )
        );
    }

    // 2] filter out unwanted field names that that are not allowed to be updated
    const filterredBody = filterObj(req.body, "name", "email");

    // 3] update the document
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        filterredBody,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        status: "success",
        data: updatedUser
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: "success",
        data: null
    });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find({}, { __v: 0 });

    // SEND RESPONSE
    res.status(200).json({
        status: "success",
        results: users.length,
        data: {
            users
        }
    });
});

exports.createUser = (req, res) => {
    res.status(500).json({
        status: "eoor",
        Message: "This route is not defined yet !"
    });
};

exports.getUser = (req, res) => {
    res.status(500).json({
        status: "eoor",
        Message: "This route is not defined yet !"
    });
};

exports.updateUser = (req, res) => {
    res.status(500).json({
        status: "eoor",
        Message: "This route is not defined yet !"
    });
};

exports.deleteUser = (req, res) => {
    res.status(500).json({
        status: "eoor",
        Message: "This route is not defined yet !"
    });
};
