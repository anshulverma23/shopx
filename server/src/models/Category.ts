import { Schema, model, Document, Types } from "mongoose";
import { withJSONId } from "./plugins";

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parent?: Types.ObjectId | null;
  createdAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: null },
    imageUrl: { type: String, default: null },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

withJSONId(categorySchema);

export const Category = model<ICategory>("Category", categorySchema);
