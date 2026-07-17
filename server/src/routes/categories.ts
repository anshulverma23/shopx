import { Router } from "express";
import { Category, Product } from "../models";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const cats = await Category.find().sort({ name: 1 });
    const counts = await Product.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$category", cnt: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id?.toString(), c.cnt]));

    res.json(
      cats.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        description: c.description ?? null,
        imageUrl: c.imageUrl ?? null,
        productCount: countMap.get(c._id.toString()) ?? 0,
        parent: c.parent ? c.parent.toString() : null,
      })),
    );
  }),
);

export default router;
