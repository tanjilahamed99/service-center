const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const SparePartStockSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    sparePart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SparePart",
      required: true,
      index: true,
    },
    ownerType: {
      type: String,
      enum: ["Company", "ServiceCenter"],
      required: true,
    },
    // null when ownerType === "Company" (the company's own central store
    // has no separate id — it's identified by `company` + ownerType alone)
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCenter",
      default: null,
    },
    quantity: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

SparePartStockSchema.index(
  { sparePart: 1, ownerType: 1, ownerId: 1 },
  { unique: true },
);
const SparePartStock = mongoose.model("SparePartStock", SparePartStockSchema);

module.exports = SparePartStock;
