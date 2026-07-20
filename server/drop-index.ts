import mongoose from "mongoose";
import { Cart } from "./src/models/Cart";
import * as dotenv from "dotenv";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("Connected");
  
  try {
    await Cart.collection.dropIndex("userId_1");
    console.log("Dropped userId_1 index successfully");
  } catch (e) {
    console.error("Error dropping index (it might not exist):", e);
  } finally {
    await mongoose.disconnect();
  }
}

run();
