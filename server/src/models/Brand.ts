import { Schema, model, Document, Types } from "mongoose";
import { withJSONId } from "./plugins";

export interface IBrand extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  logoUrl?: string | null;
  createdAt: Date;
}

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logoUrl: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

withJSONId(brandSchema);

export const Brand = model<IBrand>("Brand", brandSchema);
