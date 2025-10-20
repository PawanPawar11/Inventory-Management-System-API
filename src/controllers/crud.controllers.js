import inventoryModel from "../models/crud.model.js";
import mongoose from "mongoose";

export const createProduct = async (req, res) => {
  try {
    const { name, description, stock_quantity, low_stock_threshold } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "Name and description are required",
      });
    }

    if (stock_quantity < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Stock quantity cannot be negative" });
    }

    const newProduct = await inventoryModel.create({
      name,
      description,
      stock_quantity: stock_quantity || 0,
      low_stock_threshold: low_stock_threshold || 10,
    });

    return res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const readProducts = async (req, res) => {
  try {
    const getAllProducts = await inventoryModel.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: getAllProducts.length,
      data: getAllProducts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOneProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid product ID format" });
    }
    const fetchedProduct = await inventoryModel.findOne({ _id: id });
    if (!fetchedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    return res.status(200).json({ success: true, data: fetchedProduct });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid product ID format" });
    }

    const { name, description, stock_quantity, low_stock_threshold } = req.body;

    if (stock_quantity !== undefined && stock_quantity < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Stock quantity cannot be negative" });
    }

    const updatedProduct = await inventoryModel.findOneAndUpdate(
      { _id: id },
      {
        name,
        description,
        stock_quantity,
        low_stock_threshold,
      },
      {
        new: true,
      }
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid product ID format" });
    }
    const deletedProduct = await inventoryModel.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: deletedProduct,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const increaseStock = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid product ID format" });
  }

  const { quantity } = req.body;
  // Ensure 'quantity' is treated as a number
  const increaseAmount = Number(quantity);

  // Also check if the resulting number is valid
  if (isNaN(increaseAmount) || increaseAmount <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Quantity must be a positive number" });
  }

  try {
    // This is the atomic operation.
    // $inc atomically increments the field by the given value.
    const updatedProduct = await inventoryModel.findByIdAndUpdate(
      id, // 1. Find the document by its ID
      { $inc: { stock_quantity: increaseAmount } }, // 2. Atomically increase the stock
      {
        new: true, // 3. Return the document *after* the update is applied
      }
    );

    // If the ID was valid but no product was found, updatedProduct will be null
    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Success! Send back the updated product
    return res.status(200).json({
      success: true,
      message: `Stock increased by ${increaseAmount}`,
      data: updatedProduct,
    });
  } catch (error) {
    // Catch any other unexpected server or database errors
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const decreaseStock = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res
      .status(404)
      .json({ success: false, message: "Invalid product ID format" });
  }

  const { quantity } = req.body;
  const decreaseAmount = Number(quantity); // Ensure quantity is a number

  if (isNaN(decreaseAmount) || decreaseAmount <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Quantity must be a positive number" });
  }

  try {
    // This is the atomic operation
    const updatedProduct = await inventoryModel.findOneAndUpdate(
      {
        _id: id,
        stock_quantity: { $gte: decreaseAmount }, // 1. Check if stock is sufficient
      },
      {
        $inc: { stock_quantity: -decreaseAmount }, // 2. Decrease the stock
      },
      {
        new: true, // Return the document *after* the update
      }
    );

    // If the product wasn't found OR stock was insufficient, updatedProduct will be null
    if (!updatedProduct) {
      // We check the product again to give a more specific error message
      const product = await inventoryModel.findById(id);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      } else {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${product.stock_quantity}, Requested: ${decreaseAmount}`,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Stock decreased by ${decreaseAmount}`,
      data: updatedProduct,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const checkLowStockQuantity = async (req, res) => {
  try {
    const lowThresholdProducts = await inventoryModel
      .find({
        $expr: { $lt: ["$stock_quantity", "$low_stock_threshold"] },
      })
      .sort({ stock_quantity: 1 });

    return res.status(200).json({
      success: true,
      count: lowThresholdProducts.length,
      message: `${lowThresholdProducts.length} product(s) below stock threshold`,
      data: lowThresholdProducts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const checkApiHealth = (req, res) => {
  return res
    .status(200)
    .json({ success: true, message: "Inventory Management API is running" });
};
