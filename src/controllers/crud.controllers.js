import inventoryModel from "../models/crud.model.js";

export const createProduct = async (req, res) => {
  const { name, description, stock_quantity } = req.body;
  const newProduct = await inventoryModel.create({
    name,
    description,
    stock_quantity,
  });
  return res.status(201).json({ newProduct });
};

export const readProducts = async (req, res) => {
  const getAllProducts = await inventoryModel.find();
  return res.status(200).json({ getAllProducts });
};

export const getOneProduct = async (req, res) => {
  const { id } = req.params;
  const fetchedProduct = await inventoryModel.findOne({ _id: id });
  return res.status(200).json({ fetchedProduct });
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, stock_quantity } = req.body;
  const updatedProduct = await inventoryModel.findOneAndUpdate(
    { _id: id },
    {
      name,
      description,
      stock_quantity,
    },
    {
      new: true,
    }
  );
  res.status(200).json({ updatedProduct });
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const deletedProduct = await inventoryModel.findByIdAndDelete(id);
  res.status(200).json({ deletedProduct });
};

export const increaseStock = async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const fetchedProduct = await inventoryModel.findById(id);

  fetchedProduct.stock_quantity += quantity;
  fetchedProduct.save();

  return res.status(200).json({ fetchedProduct });
};

export const decreaseStock = async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const fetchedProduct = await inventoryModel.findById(id);

  fetchedProduct.stock_quantity -= quantity;
  fetchedProduct.save();

  return res.status(200).json({ fetchedProduct });
};
