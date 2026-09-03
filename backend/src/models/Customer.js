const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

CustomerSchema.index({ company: 1, mobileNumber: 1 }, { unique: true });

const Customer = mongoose.model("Customer", CustomerSchema);

module.exports = Customer;
