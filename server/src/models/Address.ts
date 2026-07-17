import { Schema, model, Document, Types } from "mongoose";
import { withJSONId } from "./plugins";

export interface IAddress extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: null },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true, default: "India" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

withJSONId(addressSchema);

export const Address = model<IAddress>("Address", addressSchema);
