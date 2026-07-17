import { Schema, model, Document, Types } from "mongoose";
import { withJSONId } from "./plugins";

export type SellerStatus = "pending" | "approved" | "rejected" | "suspended";

export interface ISeller extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  storeName: string;
  description?: string | null;
  logoUrl?: string | null;
  gstNumber?: string | null;
  status: SellerStatus;
  createdAt: Date;
  updatedAt: Date;
}

const sellerSchema = new Schema<ISeller>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    storeName: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    logoUrl: { type: String, default: null },
    gstNumber: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
  },
  { timestamps: true },
);

withJSONId(sellerSchema);

export const Seller = model<ISeller>("Seller", sellerSchema);
