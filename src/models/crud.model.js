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
    maxLength: 30,
  },
  stock_quantity: {
    type: Number,
    required: true,
  },
});

const inventoryModel = mongoose.model("Inventory", crudSchema);

export default inventoryModel;
