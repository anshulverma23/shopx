import { Router } from "express";
import { WishlistItem } from "../models";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { formatProduct } from "./products";

const router = Router();

router.get(
  "/wishlist",
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await WishlistItem.find({ user: req.user!.userId })
      .populate({
        path: "product",
        populate: [
          { path: "category", select: "name" },
          { path: "brand", select: "name" },
          { path: "seller", select: "storeName" },
        ],
      })
      .sort({ createdAt: -1 });

    res.json(items.filter((i: any) => i.product).map((i: any) => formatProduct(i.product)));
  }),
);

router.post(
  "/wishlist",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { productId } = req.body;
    if (!productId) {
      res.status(400).json({ error: "productId is required" });
      return;
    }
    await WishlistItem.updateOne(
      { user: req.user!.userId, product: productId },
      { $setOnInsert: { user: req.user!.userId, product: productId } },
      { upsert: true },
    );
    res.json({ message: "Added to wishlist" });
  }),
);

router.delete(
  "/wishlist/:productId",
  requireAuth,
  asyncHandler(async (req, res) => {
    await WishlistItem.deleteOne({ user: req.user!.userId, product: req.params.productId });
    res.json({ message: "Removed from wishlist" });
  }),
);

export default router;
