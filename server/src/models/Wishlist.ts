import { Schema, model, Document, Types } from "mongoose";
import { withJSONId } from "./plugins";

export interface IWishlistItem extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  product: Types.ObjectId;
  createdAt: Date;
}

const wishlistSchema = new Schema<IWishlistItem>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

wishlistSchema.index({ user: 1, product: 1 }, { unique: true });

withJSONId(wishlistSchema);

export const WishlistItem = model<IWishlistItem>("WishlistItem", wishlistSchema);
