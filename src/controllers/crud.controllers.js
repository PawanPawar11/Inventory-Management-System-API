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
        .status(400)
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
        .status(400)
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
        .status(400)
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
      .status(400)
      .json({ success: false, message: "Invalid product ID format" });
  }

  const { quantity } = req.body;

  if (quantity === undefined || quantity <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Quantity must be a positive number" });
  }

  const fetchedProduct = await inventoryModel.findById(id);

  if (!fetchedProduct) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  fetchedProduct.stock_quantity += quantity;
  fetchedProduct.save();

  return res.status(200).json({
    success: true,
    message: `Stock increased by ${quantity}`,
    data: fetchedProduct,
  });
};

export const decreaseStock = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid product ID format" });
  }

  const { quantity } = req.body;

  if (quantity === undefined || quantity <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Quantity must be a positive number" });
  }

  const fetchedProduct = await inventoryModel.findById(id);

  if (!fetchedProduct) {
    return res
      .status(400)
      .json({ success: false, message: "Product not found" });
  }

  if (fetchedProduct.stock_quantity < quantity) {
    return res.status(400).json({
      success: false,
      message: `Insufficient stock, Available: ${fetchedProduct.stock_quantity}, Requested: ${quantity}`,
    });
  }

  fetchedProduct.stock_quantity -= quantity;
  fetchedProduct.save();

  return res.status(200).json({
    success: true,
    message: `Stock decreased by ${quantity}`,
    data: fetchedProduct,
  });
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
