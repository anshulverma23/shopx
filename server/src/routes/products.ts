import { Router } from "express";
import { FilterQuery } from "mongoose";
import { Product, Category, Brand, IProduct } from "../models";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

function idOf(ref: any): string | null {
  if (!ref) return null;
  if (typeof ref === "object" && ref._id) return ref._id.toString();
  return ref.toString();
}

function nameOf(ref: any, field = "name"): string | null {
  if (!ref || typeof ref !== "object") return null;
  return ref[field] ?? null;
}

function formatProduct(p: IProduct & { category?: any; brand?: any; seller?: any }) {
  const discountPercent =
    p.discountPrice && p.price ? Math.round((1 - Number(p.discountPrice) / Number(p.price)) * 100) : null;
  return {
    id: p._id.toString(),
    name: p.name,
    slug: p.slug,
    description: p.description ?? null,
    price: p.price,
    discountPrice: p.discountPrice ?? null,
    discountPercent: discountPercent && discountPercent > 0 ? discountPercent : null,
    images: p.images ?? [],
    rating: p.rating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    stock: p.stock,
    categoryId: idOf(p.category),
    categoryName: nameOf(p.category),
    brandId: idOf(p.brand),
    brandName: nameOf(p.brand),
    sellerId: idOf(p.seller),
    sellerName: nameOf(p.seller, "storeName"),
    status: p.status,
    isFeatured: p.isFeatured,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
  };
}

interface ProductQueryFilters {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort?: string;
  status?: string;
  sellerId?: string;
  isFeatured?: boolean;
}

async function queryProducts(filters: ProductQueryFilters = {}, page = 1, limit = 20) {
  const { q, category, brand, minPrice, maxPrice, rating, sort, status, sellerId, isFeatured } = filters;

  const where: FilterQuery<IProduct> = { status: status || "approved" };
  if (sellerId) where.seller = sellerId;
  if (isFeatured === true) where.isFeatured = true;
  if (q) where.name = { $regex: q, $options: "i" };
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.$gte = minPrice;
    if (maxPrice !== undefined) where.price.$lte = maxPrice;
  }
  if (rating !== undefined) where.rating = { $gte: rating };

  if (category) {
    const cat = await Category.findOne({ slug: category }).select("_id");
    where.category = cat ? cat._id : null;
  }
  if (brand) {
    const br = await Brand.findOne({ slug: brand }).select("_id");
    where.brand = br ? br._id : null;
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { rating: -1 },
    popular: { reviewCount: -1 },
  };
  const sortBy = sortMap[sort || ""] || sortMap.newest;

  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    Product.find(where)
      .populate("category", "name")
      .populate("brand", "name")
      .populate("seller", "storeName")
      .sort(sortBy)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(where),
  ]);

  return {
    products: rows.map(formatProduct),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const { q, category, brand, minPrice, maxPrice, rating, sort } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await queryProducts(
      {
        q: q as string,
        category: category as string,
        brand: brand as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        rating: rating ? Number(rating) : undefined,
        sort: sort as string,
      },
      page,
      limit,
    );
    res.json(result);
  }),
);

router.get(
  "/products/featured",
  asyncHandler(async (_req, res) => {
    const result = await queryProducts({ isFeatured: true }, 1, 12);
    res.json(result.products);
  }),
);

router.get(
  "/products/trending",
  asyncHandler(async (_req, res) => {
    const result = await queryProducts({ sort: "popular" }, 1, 12);
    res.json(result.products);
  }),
);

router.get(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
      .populate("category", "name")
      .populate("brand", "name")
      .populate("seller", "storeName");

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({
      ...formatProduct(product),
      specifications: product.specifications ?? {},
      tags: product.tags ?? [],
      seller: product.seller
        ? {
            id: idOf(product.seller),
            storeName: nameOf(product.seller, "storeName") ?? "Unknown",
            rating: 4.5,
            totalProducts: 0,
          }
        : null,
    });
  }),
);

router.get(
  "/products/:id/related",
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).select("category");
    if (!product) {
      res.json([]);
      return;
    }
    const where: FilterQuery<IProduct> = { status: "approved", _id: { $ne: product._id } };
    if (product.category) where.category = product.category;
    const rows = await Product.find(where)
      .populate("category", "name")
      .populate("brand", "name")
      .populate("seller", "storeName")
      .sort({ createdAt: -1 })
      .limit(6);
    res.json(rows.map(formatProduct));
  }),
);

export default router;
export { queryProducts, formatProduct };
