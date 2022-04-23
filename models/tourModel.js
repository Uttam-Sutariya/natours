const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            unique: true,
            // 2 entities: 1st is value, 2nd is Error to display
            required: [true, "A tour must have a name"],
            trim: true
            // validate: [validator.isAlpha, "Name can't contain numeric data "]
        },
        slug: String,
        secretTour: {
            type: Boolean,
            default: false
        },
        duration: {
            type: Number,
            required: [true, "A tour must have a duration"]
        },
        maxGroupSize: {
            type: Number,
            required: [true, "A tour must have a group size"]
        },
        difficulty: {
            type: String,
            required: [true, "A tour must have a difficulty level"],
            trim: true,
            enum: {
                values: ["medium", "easy", "difficult"],
                message: "Difficulty is either: easy, medium, difficult"
            }
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, "Rating must be greater than 1"],
            max: [5, "Rating must be less than 5"]
        },
        ratingsQuantity: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            required: [true, "A tour must have a price"]
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (value) {
                    // this only points to the current document on new document creation
                    // Doesn't validate on updating document
                    return value < this.price;
                },
                message: "Discount can't be more than price"
            }
        },
        summary: {
            type: String,
            trim: true,
            required: [true, "A tour must have a summary"]
        },
        description: {
            type: String,
            trim: true
        },
        imageCover: {
            type: String,
            required: [true, "A tour must have cover image"]
        },
        images: [String],
        ceatedAt: {
            type: Date,
            default: Date.now()
        },
        startDates: [Date]
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

/*
    *Adding virtual properties which can be derived from other property,
    *hence we need not to store data in database

    * i.e: duration weeks can be derived from durationd days
*/

//! Don't use arrow function in get() : reason => this refers global obj in arrow function

tourSchema.virtual("durationWeeks").get(function () {
    return this.duration / 7;
});

// * DOCUMENT MIDDLEWARE: runs before the .save() & .create()
// But not before .insertMany()

tourSchema.pre("save", function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// In post middleware we don't have access to (this) instead of we have document access (doc)
// tourSchema.post("save", function (doc, next) {
//     console.log(doc);
//     next();
// });

// * QUERY MIDDLEWARE : Executes before or after any query executes

tourSchema.pre(/^find/, function (next) {
    // tourSchema.pre("find", function (next) {
    // this refers to current query not document
    this.find({ secretTour: { $ne: true } });
    next();
});

// * AGGREGATION MIDDLEWARE

tourSchema.pre("aggregate", function (next) {
    this._pipeline.unshift({ $match: { secretTour: { $ne: true } } });
    // console.log(this._pipeline);
    next();
});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
