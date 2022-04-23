const dotenv = require("dotenv");
const mongoose = require("mongoose");
/*  
    looking for env variables in config.env file
    configure it before using app
*/
dotenv.config({ path: `${__dirname}/config.env` });

const app = require("./app");

const PORT = process.env.PORT || 3000;

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
    .then(() => console.log(`DB connection successfull 🙌`));
// .catch((err) => console.log("Error in DB connection 💥"));

const server = app.listen(PORT, () => {
    console.log(`App is running on port: ${PORT}...`);
});

/* 
    Handling global unhandled rejection (unhandled promises)
    ! Asynchronous 
*/
process.on("unhandledRejection", (err) => {
    console.log("Unhandled Rejection 💥");
    console.log(err.name, err.message);
    /*
        First we close server.
        We give server time to finish all the request that are still pending or being handled.
        After server closed we exit the process
    */
    server.close(() => {
        process.exit(1);
    });
});

/* 
    Handling uncaught exceptions which are not handled anywhere
    ! Synchronous 
*/

process.on("uncaughtException", (err) => {
    console.log("Uncaught Exception 💥");
    console.log(err.name, err.message);
});
