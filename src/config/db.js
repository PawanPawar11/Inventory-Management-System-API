import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectToDB = async () => {
  try {
    const connectionURL = process.env.MONGO_URI;
    const connect = await mongoose.connect(connectionURL);
    console.log(
      `MongoDB got connected successfully! ✅
      Host address is: ${connect.connection.host}`
    );
  } catch (error) {
    console.log(
      `Error occurred while connecting to database! ❌
      Error Message: ${error.message}`
    );
  }
};
