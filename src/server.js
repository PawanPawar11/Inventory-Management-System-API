import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3001;
const app = express();

app.get("/", (req, res) => {
  res.send({ message: "Default route is working fine! ✅" });
});

app.listen(PORT, () =>
  console.log(
    `Server is running on PORT:${PORT}, Address is -> http://localhost:3001`
  )
);
