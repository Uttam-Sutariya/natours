/*
    A script to load data into DB for working with api
*/

const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("./../../models/tourModel");

dotenv.config({ path: `${__dirname}/../../config.env` });

// const DB = process.env.DATABASE_URI.replace(
//     "<PASSWORD>",
//     process.env.DATABASE_PASSWORD
// );

const DB = process.env.DB_LOCAL;

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then(() => console.log(`Successfully connected to DB`))
    .catch((err) => console.log(err));

const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/tours-simple.json`, "utf-8")
);

// Import data into DB
const importData = async () => {
    try {
        await Tour.create(tours);
        console.log("Data loaded !!!");
    } catch (err) {
        console.log(err);
    }
    process.exit();
};

// Delete all data from DB

const deleteData = async () => {
    try {
        await Tour.deleteMany();
        console.log("Data deleted !!!");
    } catch (err) {
        console.log(err);
    }
    process.exit();
};

// console.log(process.argv);

if (process.argv[2] === "--import") {
    importData();
} else if (process.argv[2] === "--delete") {
    deleteData();
}
