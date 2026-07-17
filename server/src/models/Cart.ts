import { Schema, model, Document, Types } from "mongoose";
import { withJSONId } from "./plugins";

export interface ICartItem {
  product: Types.ObjectId;
  name: string;
  price: number;
  discountPrice?: number | null;
  quantity: number;
  images: string[];
  stock: number;
}

export interface ICart extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  items: ICartItem[];
  couponCode?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number, default: null },
    quantity: { type: Number, required: true, min: 1 },
    images: { type: [String], default: [] },
    stock: { type: Number, default: 0 },
  },
  { _id: false },
);

const cartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
    couponCode: { type: String, default: null },
  },
  { timestamps: true },
);

withJSONId(cartSchema);

export const Cart = model<ICart>("Cart", cartSchema);
