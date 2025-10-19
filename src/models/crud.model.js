import mongoose from "mongoose";

const crudSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minLength: [3, "Product name must be at least 3 characters"],
      maxLength: [20, "Product name cannot be greater than 20 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxLength: [
        50,
        "Product description cannot be greater than 50 characters",
      ],
    },
    stock_quantity: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock quantity cannot be negative"],
      default: 0,
    },
    low_stock_threshold: {
      type: Number,
      default: 10,
      min: [0, "Threshold cannot be negative"],
    },
  },
  { timestamps: true }
);

const inventoryModel = mongoose.model("Inventory", crudSchema);

export default inventoryModel;
