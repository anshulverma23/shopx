import { Schema, model, Document, Types } from "mongoose";
import { withJSONId } from "./plugins";

export interface IReview extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  product: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

reviewSchema.index({ product: 1, createdAt: 1 });

withJSONId(reviewSchema);

export const Review = model<IReview>("Review", reviewSchema);
