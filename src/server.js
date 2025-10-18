import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDB } from "./config/db.js";
import crudRouter from "./routes/crud.routes.js";

dotenv.config();

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(express.json());

connectToDB();

app.use("/api", crudRouter);

app.listen(PORT, () =>
  console.log(
    `Server is running on PORT:${PORT} 
    Address is -> http://localhost:5001`
  )
);
