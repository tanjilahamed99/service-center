const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const CompanySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    gstNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
    },

    // Login credentials for the Company's own login
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // never returned by default in queries
    },

    creationDate: {
      type: Date,
      default: Date.now,
    },
    subscriptionPlan: {
      fromDate: { type: Date, required: true },
      toDate: { type: Date, required: true },
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true },
);

// Hash password before saving, only if it was changed
CompanySchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Instance method to verify a login attempt
CompanySchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// True if today falls within the subscription window
CompanySchema.virtual("isSubscriptionValid").get(function () {
  if (!this.subscriptionPlan?.toDate) return false;
  return new Date() <= this.subscriptionPlan.toDate;
});

CompanySchema.index({ companyName: 1 });
CompanySchema.index({ status: 1 });

const Company = mongoose.model("Company", CompanySchema);

module.exports = Company;
