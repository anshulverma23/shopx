import mongoose from "mongoose";
import { Cart } from "./src/models/Cart";
import { Product } from "./src/models/Product";
import * as dotenv from "dotenv";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("Connected");
  
  const user = new mongoose.Types.ObjectId();
  console.log("Testing user:", user);
  
  try {
    const cart = await Cart.findOneAndUpdate(
      { user },
      { $setOnInsert: { user, items: [] } },
      { new: true, upsert: true }
    );
    console.log("Cart created:", cart);
    
    // push a dummy item
    cart.items.push({
      product: new mongoose.Types.ObjectId(),
      name: "Test Product",
      price: 100,
      discountPrice: null,
      quantity: 1,
      images: [],
      stock: 10
    } as any);
    
    await cart.save();
    console.log("Cart saved successfully");
    
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await mongoose.disconnect();
  }
}

run();
