const express = require("express");
const app = express();
const userRoutes = require("./routes/userRoutes");
const AppError = require("./utils/appError");

app.use(express.json());


// app.use((req, res, next) => {
//     // const err = new Error(`we can't find ${req.originalUrl} into routh`);
//     // err.status = 'fail';
//     // err.statusCode = 404;
//     next(new AppError(` can't find ${req.originalUrl} into this rout`, 404));
//   });

app.use("/api/v1/users", userRoutes);

module.exports = app;