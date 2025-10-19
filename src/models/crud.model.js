import mongoose from "mongoose";

const crudSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    minLength: 3,
    maxLength: 20,
    required: true,
  },
  description: {
    type: String,
    trim: true,
    maxLength: 50,
  },
  stock_quantity: {
    type: Number,
    required: true,
  },
  low_stock_threshold: {
    type: Number,
    default: 10,
    min: 0,
  },
});

const inventoryModel = mongoose.model("Inventory", crudSchema);

export default inventoryModel;
