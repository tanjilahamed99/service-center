const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    brand: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true },
);

ProductSchema.index(
  { company: 1, brand: 1, productName: 1, model: 1 },
  { unique: true },
);
ProductSchema.index({ company: 1, brand: 1 });

const Product = mongoose.model("Product", ProductSchema);

module.exports = Product;
