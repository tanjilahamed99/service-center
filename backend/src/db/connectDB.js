const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  console.log("connection to database...");
  await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });

  console.log("successfully connected to database!");
};

module.exports = connectDB;
