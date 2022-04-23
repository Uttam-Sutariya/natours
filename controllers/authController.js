const crypto = require("crypto");
const { promisify } = require("util"); // used to make function promise based
const User = require("./../models/userModel.js");
const catchAsync = require("./../utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require("./../utils/appError");
const sendEmail = require("./../utils/email");

// Signing the JWT
const signToken = (_id) => {
    return jwt.sign({ id: _id }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOption = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };

    if (process.env.NODE_ENV === "production") cookieOption.secure = true;

    res.cookie("jwt", token, cookieOption);

    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user
        }
    });
};

exports.signUp = catchAsync(async (req, res, next) => {
    // const newUser = await User.create(req.body);

    const newUser = await User.create({
        // do this way to prevent anyone from making themselves admin by passing role: admin
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });

    // jwt.sign(payload, secretOrPrivateKey, [options, callback])
    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) If email & password exists
    if (!email || !password) {
        return next(new AppError("Please provide email & password", 400));
    }

    // 2) Check if the user exist && password is correct
    const user = await User.findOne({ email }, { password: 1, email: 1 });
    // const user = await User.findOne({ email }).select("+password");

    // check password
    // ('123456') === '$2a$08$xqPRTEOKSKYEHCFdaub3iuLmdOx7iVOdRPHEHrQxhw3O7UBljAvFe'
    // using bcrypt

    if (!user || !(await user.checkPassword(password, user.password))) {
        return next(new AppError("Incorect email or password", 401));
    }

    // 3) If everyting is okay send the tocken to client
    createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
    // 1) get token and check if it's there
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return next(new AppError("Please login to get access", 401));
    }

    // 2) verify the token
    const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET_KEY
    );

    // 3) check if user still exist
    const user = await User.findById(decoded.id);

    if (!user) {
        return next(new AppError("User does not exist with this token", 401));
    }

    // 4) check if user changed password after the token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
        next(new AppError("Password changed, please login again", 401));
    }

    // grant access to the protected route
    req.user = user;
    next();
});

exports.restictTo = (...roles) => {
    return (req, res, next) => {
        // we can access roles array because of closures
        if (!roles.includes(req.user.role)) {
            return next(new AppError("You don't have permission", 403));
        }

        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    //1) get user based on posted email
    const user = await User.findOne({ email: req.body.email });

    if (!user)
        return next(
            new AppError("User doesn't exist with provided email", 404)
        );

    //2) Generate the random token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    //3) send it to user's email
    const resetURL = `${req.protocol}://${req.get(
        "host"
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your passwrd ? change password at: ${resetURL}, If you didn't forgot your password please ignore this message`;

    try {
        await sendEmail({
            email: user.email,
            subject: "Your password reset token, (Valid for 10 minutes)",
            message
        });

        res.status(200).json({
            status: "success",
            message: "Token sent to email"
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            new AppError(
                "There was an error while sending email, please try again later",
                500
            )
        );
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1] Get user based on the token
    const hasedToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    const user = await User.findOne({
        passwordResetToken: hasedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    // 2] change password if token not expired and there is user
    if (!user) {
        return next(new AppError("Token invalid or expired", 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // 3] login the user and send JWT
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1] Get the user from collection
    const user = await User.findById(req.user.id, { password: 1 });

    // 2] chck if posted password is correct
    if (!(await user.checkPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError("Your current password is wrong", 401));
    }
    // 3] if so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save(); // we use save to run validators, if we used finndByIdAndUpdate it won't gonna run validators

    // 4] Login user, send JWT
    createSendToken(user, 200, res);
});
