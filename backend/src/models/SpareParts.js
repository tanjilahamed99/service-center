const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const SparePartSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    brand: { type: String, required: true, trim: true },
    product: { type: String, required: true, trim: true },
    modelNumber: { type: String, trim: true },
    spareName: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    unit: { type: String, trim: true, default: "pcs" },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true },
);

SparePartSchema.index({ company: 1, brand: 1, product: 1 });

const SparePart = mongoose.model("SparePart", SparePartSchema);

module.exports = SparePart;
