import express from "express";
import {
  createProduct,
  readProducts,
  getOneProduct,
  updateProduct,
  deleteProduct,
  increaseStock,
  decreaseStock,
} from "../controllers/crud.controllers.js";

const Router = express.Router();

Router.post("/create", createProduct);
Router.get("/read-all-products", readProducts);
Router.get("/read-one-product/:id", getOneProduct);
Router.put("/update/:id", updateProduct);
Router.delete("/delete/:id", deleteProduct);
Router.put("/increase/:id", increaseStock);
Router.put("/decrease/:id", decreaseStock);

export default Router;
