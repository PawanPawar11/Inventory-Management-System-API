import express from "express";

const Router = express.Router();

Router.post("/create");
Router.get("/read");
Router.put("/update");
Router.delete("/delete");

export default Router;
