const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const ServiceCenterSchema = new mongoose.Schema(
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
    address: {
      type: String,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    gstNumber: {
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

// Username only needs to be unique within a company, mirroring the Customer model's pattern.
ServiceCenterSchema.index({ company: 1, username: 1 }, { unique: true });

ServiceCenterSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

ServiceCenterSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const ServiceCenter = mongoose.model("ServiceCenter", ServiceCenterSchema);

module.exports = ServiceCenter;
