import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDB } from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 3001;
app.use(cors());
const app = express();

connectToDB();

app.get("/", (req, res) => {
  res.send({ message: "Default route is working fine! ✅" });
});

app.listen(PORT, () =>
  console.log(
    `Server is running on PORT:${PORT} 
    Address is -> http://localhost:5001`
  )
);
