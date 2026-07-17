import { Router } from "express";
import { Review, Product } from "../models";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get(
  "/products/:id/reviews",
  asyncHandler(async (req, res) => {
    const reviews = await Review.find({ product: req.params.id })
      .populate("user", "name avatarUrl")
      .sort({ createdAt: 1 });

    res.json(
      reviews.map((r: any) => ({
        id: r._id.toString(),
        userId: r.user?._id ? r.user._id.toString() : r.user.toString(),
        userName: r.user?.name ?? "User",
        userAvatar: r.user?.avatarUrl ?? null,
        productId: r.product.toString(),
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
    );
  }),
);

router.post(
  "/products/:id/reviews",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    if (!rating || !comment) {
      res.status(400).json({ error: "rating and comment required" });
      return;
    }
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const review = await Review.create({
      user: req.user!.userId,
      product: productId,
      rating,
      comment,
    });

    const stats = await Review.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: null, avg: { $avg: "$rating" }, cnt: { $sum: 1 } } },
    ]);
    product.rating = Number((stats[0]?.avg ?? 0).toFixed(2));
    product.reviewCount = stats[0]?.cnt ?? 0;
    await product.save();

    const populated = await review.populate("user", "name avatarUrl");
    const user = populated.user as any;

    res.status(201).json({
      id: review._id.toString(),
      userId: user?._id ? user._id.toString() : String(review.user),
      userName: user?.name ?? "User",
      userAvatar: user?.avatarUrl ?? null,
      productId: review.product.toString(),
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    });
  }),
);

export default router;
