import { Schema, model, Document, Types } from "mongoose";
import { withJSONId } from "./plugins";

export type DiscountType = "percent" | "flat";

export interface ICoupon extends Document {
  _id: Types.ObjectId;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrder?: number | null;
  maxDiscount?: number | null;
  isActive: boolean;
  expiresAt?: Date | null;
  createdAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ["percent", "flat"], required: true },
    discountValue: { type: Number, required: true },
    minOrder: { type: Number, default: null },
    maxDiscount: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

withJSONId(couponSchema);

export const Coupon = model<ICoupon>("Coupon", couponSchema);
