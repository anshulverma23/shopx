import { Schema, model, Document, Types } from "mongoose";
import { withJSONId } from "./plugins";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";
export type PaymentMethod = "cod" | "razorpay";
export type PaymentStatus = "pending" | "paid" | "refunded";

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  sellerId?: Types.ObjectId | null;
}

export interface IAddressSnapshot {
  id?: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  items: IOrderItem[];
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discount: number;
  total: number;
  addressSnapshot: IAddressSnapshot;
  couponCode?: string | null;
  trackingNumber?: string | null;
  notes?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    imageUrl: { type: String, default: null },
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", default: null },
  },
  { _id: false },
);

const addressSnapshotSchema = new Schema<IAddressSnapshot>(
  {
    id: { type: String },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: null },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [orderItemSchema], default: [] },
    status: {
      type: String,
      enum: ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"],
      default: "pending",
    },
    paymentMethod: { type: String, enum: ["cod", "razorpay"], default: "cod" },
    paymentStatus: { type: String, enum: ["pending", "paid", "refunded"], default: "pending" },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    addressSnapshot: { type: addressSnapshotSchema, required: true },
    couponCode: { type: String, default: null },
    trackingNumber: { type: String, default: null },
    notes: { type: String, default: null },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ "items.sellerId": 1 });

withJSONId(orderSchema);

export const Order = model<IOrder>("Order", orderSchema);
