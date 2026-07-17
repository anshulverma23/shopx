import { Router } from "express";
import {
  User,
  Seller,
  Product,
  Order,
  Category,
  Brand,
  Coupon,
  IUser,
  ISeller,
  IOrder,
} from "../models";
import { requireAuth, requireRole } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { formatProduct } from "./products";
import { formatOrder } from "./orders";

const router = Router();

router.use(requireAuth, requireRole("admin"));

function formatUser(u: IUser) {
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

function formatSeller(s: ISeller) {
  return {
    id: s._id.toString(),
    userId: s.user.toString(),
    storeName: s.storeName,
    description: s.description ?? null,
    logoUrl: s.logoUrl ?? null,
    status: s.status,
    totalProducts: 0,
    totalSales: 0,
    rating: 4.5,
    gstNumber: s.gstNumber ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

function buildRevenueChart(orders: IOrder[], onlyDelivered = false) {
  const now = new Date();
  const chart: Array<{ date: string; revenue: number; orders: number }> = [];
  for (let d = 29; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);
    const dayStr = day.toISOString().slice(0, 10);
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const dayOrders = orders.filter(
      (o) =>
        o.createdAt >= dayStart &&
        o.createdAt < dayEnd &&
        (!onlyDelivered || o.status === "delivered"),
    );
    chart.push({
      date: dayStr,
      revenue: dayOrders.reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    });
  }
  return chart;
}

router.get(
  "/admin/dashboard",
  asyncHandler(async (_req, res) => {
    const [totalUsers, totalSellers, totalProducts, totalOrders] = await Promise.all([
      User.countDocuments(),
      Seller.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
    ]);
    const orders = await Order.find().sort({ createdAt: -1 }).limit(500);

    const totalRevenue = orders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.total, 0);
    const pendingOrders = orders.filter((o) => o.status === "pending").length;

    const catCounts = await Product.aggregate([
      { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "cat" } },
      {
        $group: {
          _id: { $ifNull: [{ $arrayElemAt: ["$cat.name", 0] }, "Uncategorized"] },
          cnt: { $sum: 1 },
        },
      },
    ]);
    const categoryBreakdown = catCounts.map((c) => ({ name: c._id, count: c.cnt }));

    res.json({
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      recentOrders: orders.slice(0, 10).map(formatOrder),
      revenueChart: buildRevenueChart(orders),
      categoryBreakdown,
    });
  }),
);

router.get(
  "/admin/users",
  asyncHandler(async (req, res) => {
    const { q, status, role } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (role) where.role = role;
    if (q) {
      where.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }
    const [users, total] = await Promise.all([
      User.find(where)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(where),
    ]);
    res.json({ users: users.map(formatUser), total, page });
  }),
);

router.patch(
  "/admin/users/:id/status",
  asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ message: "Updated" });
  }),
);

router.get(
  "/admin/sellers",
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const sellers = await Seller.find(where).sort({ createdAt: -1 });
    res.json(sellers.map(formatSeller));
  }),
);

router.patch(
  "/admin/sellers/:id/status",
  asyncHandler(async (req, res) => {
    await Seller.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ message: "Updated" });
  }),
);

router.get(
  "/admin/products",
  asyncHandler(async (req, res) => {
    const { q, status } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (q) where.name = { $regex: q, $options: "i" };

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

router.patch(
  "/admin/products/:id/status",
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const updates: Record<string, unknown> = { status };
    if (status === "featured") {
      updates.isFeatured = true;
      updates.status = "approved";
    }
    await Product.findByIdAndUpdate(req.params.id, updates);
    res.json({ message: "Updated" });
  }),
);

router.get(
  "/admin/orders",
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const orders = await Order.find(where).sort({ createdAt: -1 }).limit(200);
    res.json(orders.map(formatOrder));
  }),
);

router.get(
  "/admin/categories",
  asyncHandler(async (_req, res) => {
    const cats = await Category.find().sort({ name: 1 });
    const counts = await Product.aggregate([{ $group: { _id: "$category", cnt: { $sum: 1 } } }]);
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

router.post(
  "/admin/categories",
  asyncHandler(async (req, res) => {
    const { name, slug, description, imageUrl, parent } = req.body;
    if (!name || !slug) {
      res.status(400).json({ error: "name and slug are required" });
      return;
    }
    const cat = await Category.create({
      name,
      slug,
      description: description ?? null,
      imageUrl: imageUrl ?? null,
      parent: parent || null,
    });
    res.status(201).json({
      id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? null,
      imageUrl: cat.imageUrl ?? null,
      productCount: 0,
      parent: cat.parent ? cat.parent.toString() : null,
    });
  }),
);

router.patch(
  "/admin/categories/:id",
  asyncHandler(async (req, res) => {
    const { name, slug, description, imageUrl, parent } = req.body;
    const cat = await Category.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(parent !== undefined && { parent: parent || null }),
      },
      { new: true },
    );
    if (!cat) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({
      id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? null,
      imageUrl: cat.imageUrl ?? null,
      productCount: 0,
      parent: cat.parent ? cat.parent.toString() : null,
    });
  }),
);

router.delete(
  "/admin/categories/:id",
  asyncHandler(async (req, res) => {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  }),
);

router.post(
  "/admin/brands",
  asyncHandler(async (req, res) => {
    const { name, slug, logoUrl } = req.body;
    if (!name || !slug) {
      res.status(400).json({ error: "name and slug are required" });
      return;
    }
    const brand = await Brand.create({ name, slug, logoUrl: logoUrl ?? null });
    res.status(201).json({
      id: brand._id.toString(),
      name: brand.name,
      slug: brand.slug,
      logoUrl: brand.logoUrl ?? null,
      productCount: 0,
    });
  }),
);

router.get(
  "/admin/coupons",
  asyncHandler(async (_req, res) => {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(
      coupons.map((c) => ({
        id: c._id.toString(),
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrder: c.minOrder ?? null,
        maxDiscount: c.maxDiscount ?? null,
        isActive: c.isActive,
        expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
      })),
    );
  }),
);

router.post(
  "/admin/coupons",
  asyncHandler(async (req, res) => {
    const { code, discountType, discountValue, minOrder, maxDiscount, expiresAt } = req.body;
    if (!code || !discountType || discountValue === undefined) {
      res.status(400).json({ error: "code, discountType, and discountValue are required" });
      return;
    }
    const coupon = await Coupon.create({
      code: String(code).toUpperCase(),
      discountType,
      discountValue,
      minOrder: minOrder ?? null,
      maxDiscount: maxDiscount ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
    });
    res.status(201).json({
      id: coupon._id.toString(),
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrder: coupon.minOrder ?? null,
      maxDiscount: coupon.maxDiscount ?? null,
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
    });
  }),
);

router.get(
  "/admin/analytics/revenue",
  asyncHandler(async (_req, res) => {
    const orders = await Order.find({ status: "delivered" }).limit(1000);
    res.json(buildRevenueChart(orders));
  }),
);

export default router;
