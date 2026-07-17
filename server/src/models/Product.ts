import { Schema, model, Document, Types } from "mongoose";
import { withJSONId } from "./plugins";

export type ProductStatus = "pending" | "approved" | "rejected";

export interface IProduct extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  images: string[];
  category?: Types.ObjectId | null;
  brand?: Types.ObjectId | null;
  seller?: Types.ObjectId | null;
  stock: number;
  rating: number;
  reviewCount: number;
  specifications: Record<string, string>;
  tags: string[];
  status: ProductStatus;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: null },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: null, min: 0 },
    images: { type: [String], default: [] },
    category: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    brand: { type: Schema.Types.ObjectId, ref: "Brand", default: null },
    seller: { type: Schema.Types.ObjectId, ref: "Seller", default: null },
    stock: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    specifications: { type: Schema.Types.Mixed, default: {} },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

productSchema.index({ name: "text", description: "text" });
productSchema.index({ status: 1, isFeatured: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ seller: 1 });

withJSONId(productSchema);

export const Product = model<IProduct>("Product", productSchema);
