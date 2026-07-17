import { Router } from "express";
import { Seller, Product, Order, User, ISeller, IOrder } from "../models";
import { requireAuth, requireRole, signTokens } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { slugifyUnique } from "../utils/slugify";
import { formatProduct } from "./products";
import { formatOrder } from "./orders";

const router = Router();

function formatSeller(s: ISeller, stats?: { totalProducts?: number; totalSales?: number }) {
  return {
    id: s._id.toString(),
    userId: s.user.toString(),
    storeName: s.storeName,
    description: s.description ?? null,
    logoUrl: s.logoUrl ?? null,
    status: s.status,
    totalProducts: stats?.totalProducts ?? 0,
    totalSales: stats?.totalSales ?? 0,
    rating: 4.5,
    gstNumber: s.gstNumber ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

function formatUserForSellerResponse(u: InstanceType<typeof User>) {
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    phone: u.phone ?? null,
    avatarUrl: u.avatarUrl ?? null,
    role: u.role,
    isVerified: u.isVerified,
    status: u.status,
    createdAt: u.createdAt.toISOString(),
  };
}

async function getOwnSeller(userId: string) {
  return Seller.findOne({ user: userId });
}

router.post(
  "/sellers/register",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { storeName, description, gstNumber } = req.body;
    if (!storeName) {
      res.status(400).json({ error: "storeName required" });
      return;
    }
    const existing = await Seller.findOne({ user: userId });
    if (existing) {
      res.status(400).json({ error: "Already registered as seller" });
      return;
    }
    const seller = await Seller.create({
      user: userId,
      storeName,
      description: description ?? null,
      gstNumber: gstNumber ?? null,
      status: "pending",
    });

    const user = await User.findByIdAndUpdate(userId, { role: "seller" }, { new: true });

    // The JWT the client is currently holding still carries the old role
    // (e.g. "buyer"), so seller-only routes would reject it. Issue a fresh
    // pair of tokens with the updated role so the client can switch over
    // immediately without requiring a separate login.
    const tokens = signTokens(user!._id.toString(), user!.role);
    user!.refreshToken = tokens.refreshToken;
    await user!.save();

    res.status(201).json({
      ...formatSeller(seller),
      ...tokens,
      user: formatUserForSellerResponse(user!),
    });
  }),
);

router.get(
  "/sellers/me",
  requireAuth,
  requireRole("seller", "admin"),
  asyncHandler(async (req, res) => {
    const seller = await getOwnSeller(req.user!.userId);
    if (!seller) {
      res.status(404).json({ error: "Seller not found" });
      return;
    }
    res.json(formatSeller(seller));
  }),
);

router.patch(
  "/sellers/me",
  requireAuth,
  requireRole("seller", "admin"),
  asyncHandler(async (req, res) => {
    const existing = await getOwnSeller(req.user!.userId);
    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const { storeName, description, logoUrl, gstNumber } = req.body;
    const seller = await Seller.findByIdAndUpdate(
      existing._id,
      {
        ...(storeName && { storeName }),
        ...(description !== undefined && { description }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(gstNumber !== undefined && { gstNumber }),
      },
      { new: true },
    );
    res.json(formatSeller(seller!));
  }),
);

router.get(
  "/sellers/me/dashboard",
  requireAuth,
  requireRole("seller", "admin"),
  asyncHandler(async (req, res) => {
    const seller = await getOwnSeller(req.user!.userId);
    if (!seller) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const products = await Product.find({ seller: seller._id }).select("_id");
    const productIds = new Set(products.map((p) => p._id.toString()));

    const sellerOrders: IOrder[] = await Order.find({ "items.sellerId": seller._id })
      .sort({ createdAt: -1 })
      .limit(500);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalSales = sellerOrders
      .filter((o) => o.status === "delivered")
      .reduce((s, o) => s + o.total, 0);
    const todaySales = sellerOrders
      .filter((o) => o.status === "delivered" && o.createdAt >= startOfToday)
      .reduce((s, o) => s + o.total, 0);
    const monthlySales = sellerOrders
      .filter((o) => o.status === "delivered" && o.createdAt >= startOfMonth)
      .reduce((s, o) => s + o.total, 0);
    const pendingOrders = sellerOrders.filter((o) =>
      ["pending", "confirmed", "packed", "shipped"].includes(o.status),
    ).length;
    const completedOrders = sellerOrders.filter((o) => o.status === "delivered").length;
    const cancelledOrders = sellerOrders.filter((o) => o.status === "cancelled").length;

    const revenueChart: Array<{ date: string; revenue: number; orders: number }> = [];
    for (let d = 29; d >= 0; d--) {
      const day = new Date(now);
      day.setDate(day.getDate() - d);
      const dayStr = day.toISOString().slice(0, 10);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayOrders = sellerOrders.filter(
        (o) => o.createdAt >= dayStart && o.createdAt < dayEnd && o.status === "delivered",
      );
      revenueChart.push({
        date: dayStr,
        revenue: dayOrders.reduce((s, o) => s + o.total, 0),
        orders: dayOrders.length,
      });
    }

    const productSales = new Map<
      string,
      { name: string; imageUrl: string | null; sales: number; revenue: number }
    >();
    for (const order of sellerOrders.filter((o) => o.status === "delivered")) {
      for (const item of order.items) {
        const pid = item.product.toString();
        if (productIds.has(pid)) {
          const existing = productSales.get(pid) ?? {
            name: item.name,
            imageUrl: item.imageUrl ?? null,
            sales: 0,
            revenue: 0,
          };
          existing.sales += item.quantity;
          existing.revenue += item.price * item.quantity;
          productSales.set(pid, existing);
        }
      }
    }
    const topProducts = Array.from(productSales.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.json({
      totalSales,
      todaySales,
      monthlySales,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalProducts: products.length,
      topProducts,
      revenueChart,
    });
  }),
);

router.get(
  "/sellers/me/products",
  requireAuth,
  requireRole("seller", "admin"),
  asyncHandler(async (req, res) => {
    const seller = await getOwnSeller(req.user!.userId);
    if (!seller) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const where: Record<string, unknown> = { seller: seller._id };
    if (req.query.status) where.status = req.query.status;

    const [rows, total] = await Promise.all([
      Product.find(where)
        .populate("category", "name")
        .populate("brand", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(where),
    ]);

    res.json({
      products: rows.map((p) => formatProduct(p)),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  }),
);

router.post(
  "/sellers/me/products",
  requireAuth,
  requireRole("seller", "admin"),
  asyncHandler(async (req, res) => {
    const seller = await getOwnSeller(req.user!.userId);
    if (!seller) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const { name, description, price, discountPrice, images, categoryId, brandId, stock, specifications, tags } =
      req.body;
    if (!name || price === undefined) {
      res.status(400).json({ error: "name and price are required" });
      return;
    }
    const product = await Product.create({
      name,
      slug: slugifyUnique(name),
      description: description ?? null,
      price,
      discountPrice: discountPrice ?? null,
      images: images ?? [],
      category: categoryId ?? null,
      brand: brandId ?? null,
      seller: seller._id,
      stock: stock ?? 0,
      specifications: specifications ?? {},
      tags: tags ?? [],
      status: "pending",
    });
    res.status(201).json(formatProduct(product));
  }),
);

router.patch(
  "/sellers/me/products/:id",
  requireAuth,
  requireRole("seller", "admin"),
  asyncHandler(async (req, res) => {
    const seller = await getOwnSeller(req.user!.userId);
    if (!seller) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const { name, description, price, discountPrice, images, categoryId, brandId, stock, specifications, tags } =
      req.body;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: seller._id },
      {
        ...(name && { name, slug: slugifyUnique(name) }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(discountPrice !== undefined && { discountPrice: discountPrice || null }),
        ...(images && { images }),
        ...(categoryId !== undefined && { category: categoryId || null }),
        ...(brandId !== undefined && { brand: brandId || null }),
        ...(stock !== undefined && { stock }),
        ...(specifications && { specifications }),
        ...(tags && { tags }),
      },
      { new: true },
    );
    if (!product) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(formatProduct(product));
  }),
);

router.delete(
  "/sellers/me/products/:id",
  requireAuth,
  requireRole("seller", "admin"),
  asyncHandler(async (req, res) => {
    const seller = await getOwnSeller(req.user!.userId);
    if (!seller) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    await Product.deleteOne({ _id: req.params.id, seller: seller._id });
    res.json({ message: "Product deleted" });
  }),
);

router.get(
  "/sellers/me/orders",
  requireAuth,
  requireRole("seller", "admin"),
  asyncHandler(async (req, res) => {
    const seller = await getOwnSeller(req.user!.userId);
    if (!seller) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const { status } = req.query;
    const where: Record<string, unknown> = { "items.sellerId": seller._id };
    if (status) where.status = status;
    const orders = await Order.find(where).sort({ createdAt: -1 }).limit(500);
    res.json(orders.map(formatOrder));
  }),
);

router.patch(
  "/sellers/me/orders/:id/status",
  requireAuth,
  requireRole("seller", "admin"),
  asyncHandler(async (req, res) => {
    const { status, trackingNumber } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { ...(status && { status }), ...(trackingNumber && { trackingNumber }) },
      { new: true },
    );
    if (!order) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(formatOrder(order));
  }),
);

export default router;
