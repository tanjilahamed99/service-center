const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: [true, "Email is required!"],
    // unique: [true, "Email already exist"],
  },
  image: {
    type: String,
  },
  otp: {
    type: String,
  },
  otpExpiresAt: {
    type: Date,
  },
  otpRequestedAt: {
    type: Date,
  },
  password: {
    type: String,
  },
  role: {
    type: String,
    enum: ["admin", "company", "service-center", 'service-engineer'],
    default: "service-engineer",
  },
  address: {
    type: String,
    default: "",
  },
  phone: {
    type: String,
    default: "",
  },
  createdAt: { type: Date, default: Date.now },
  referenceBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  busy: { type: Boolean, default: false },
  department: {
    type: String,
    enum: [
      "reception",
      "room-service",
      "restaurant",
      "manager",
      "duty-manager",
      "staff",
    ],
  },
});

userSchema.pre("save", async function (next) {
  if (this.isNew && this.password) {
    const saltRounds = 10;
    const hash = await bcrypt.hash(this.password, saltRounds);
    this.password = hash;
  }

  if (this.isNew && this.otp) {
    const oneDayLater = new Date();
    oneDayLater.setDate(oneDayLater.getDate() + 1);
    this.otpExpiredDate = oneDayLater;
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
