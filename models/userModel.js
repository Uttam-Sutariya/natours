const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please tell us your name"]
    },
    email: {
        type: String,
        required: [true, "Please provide your email"],
        unique: true,
        validate: [validator.isEmail, "Please provide a valid email"],
        lowercase: true
    },
    photo: {
        type: String
    },
    role: {
        type: String,
        enum: ["admin", "user", "guide", "lead-guide"],
        default: "user"
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        minLength: 5,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, "Please confirm password"],
        validate: {
            // only work on SAVE()
            validator: function (el) {
                return el === this.password;
            },
            message: "Password must match"
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre("save", async function (next) {
    // check if password is modified or not
    if (!this.isModified("password")) return next();

    // hash the password
    this.password = await bcrypt.hash(this.password, 8);

    // delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre("save", function (next) {
    if (!this.isModified("password") || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});

// instance method
// available on all the documents created by this model

userSchema.methods.checkPassword = async function (
    candidatePassword,
    dbPassword
) {
    return await bcrypt.compare(candidatePassword, dbPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );

        return JWTTimestamp <= changedTimeStamp;
    }

    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    console.log({ resetToken }, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = new mongoose.model("User", userSchema);

module.exports = User;
