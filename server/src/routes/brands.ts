import { Router } from "express";
import { Brand, Product } from "../models";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get(
  "/brands",
  asyncHandler(async (_req, res) => {
    const brands = await Brand.find().sort({ name: 1 });
    const counts = await Product.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$brand", cnt: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id?.toString(), c.cnt]));

    res.json(
      brands.map((b) => ({
        id: b._id.toString(),
        name: b.name,
        slug: b.slug,
        logoUrl: b.logoUrl ?? null,
        productCount: countMap.get(b._id.toString()) ?? 0,
      })),
    );
  }),
);

export default router;
