import mongoose from "mongoose";
import { Order } from "./src/models/Order";
import * as dotenv from "dotenv";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("Connected");
  
  try {
    const indexes = await Order.collection.indexes();
    console.log("Indexes on orders collection:", indexes);
    
    // Attempt to drop orderNumber_1 if it exists
    const hasOrderNumberIndex = indexes.some(idx => idx.name === "orderNumber_1");
    if (hasOrderNumberIndex) {
        await Order.collection.dropIndex("orderNumber_1");
        console.log("Dropped orderNumber_1 index successfully");
    } else {
        console.log("No orderNumber_1 index found.");
    }

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await mongoose.disconnect();
  }
}

run();
