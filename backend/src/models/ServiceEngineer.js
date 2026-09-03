const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const ServiceEngineerSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    serviceCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCenter",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    aadharNumber: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // never returned by default — use .select("+password") for login
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true },
);

// Username only needs to be unique within a company.
ServiceEngineerSchema.index({ company: 1, username: 1 }, { unique: true });

ServiceEngineerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

ServiceEngineerSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const ServiceEngineer = mongoose.model(
  "ServiceEngineer",
  ServiceEngineerSchema,
);

module.exports = ServiceEngineer;
