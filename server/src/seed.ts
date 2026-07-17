/**
 * Populates the database with enough sample data to explore every screen of
 * the app: categories, brands, an admin account, a seller account with
 * approved products, and a coupon code.
 *
 * Run with: npm run seed
 */
import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "./config/db";
import { User, Category, Brand, Seller, Product, Coupon } from "./models";
import { slugifyBase } from "./utils/slugify";
import { logger } from "./utils/logger";

async function seed() {
  await connectDB();

  logger.info("Seeding database...");

  // ── Admin user ──────────────────────────────────────────────────────
  const adminEmail = "admin@shopx.test";
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: "Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash("Admin@123", 10),
      role: "admin",
      isVerified: true,
      status: "active",
    });
    logger.info("Created admin user: admin@shopx.test / Admin@123");
  }

  // ── Categories ──────────────────────────────────────────────────────
  const categoryNames = ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports", "Books"];
  const categories = new Map<string, any>();
  for (const name of categoryNames) {
    const slug = slugifyBase(name);
    let cat = await Category.findOne({ slug });
    if (!cat) cat = await Category.create({ name, slug });
    categories.set(name, cat);
  }

  // ── Brands ──────────────────────────────────────────────────────────
  const brandNames = ["Nova", "Urban Edge", "Everline", "Pulse", "Aurora"];
  const brands = new Map<string, any>();
  for (const name of brandNames) {
    const slug = slugifyBase(name);
    let brand = await Brand.findOne({ slug });
    if (!brand) brand = await Brand.create({ name, slug });
    brands.set(name, brand);
  }

  // ── Seller account ──────────────────────────────────────────────────
  const sellerEmail = "seller@shopx.test";
  let sellerUser = await User.findOne({ email: sellerEmail });
  if (!sellerUser) {
    sellerUser = await User.create({
      name: "Demo Seller",
      email: sellerEmail,
      passwordHash: await bcrypt.hash("Seller@123", 10),
      role: "seller",
      isVerified: true,
      status: "active",
    });
    logger.info("Created seller user: seller@shopx.test / Seller@123");
  }
  let seller = await Seller.findOne({ user: sellerUser._id });
  if (!seller) {
    seller = await Seller.create({
      user: sellerUser._id,
      storeName: "ShopX Official Store",
      description: "Curated products across electronics, fashion, and home essentials.",
      status: "approved",
    });
  }

  // ── Sample products ─────────────────────────────────────────────────
  const sampleProducts = [
    {
      name: "Wireless Noise-Cancelling Headphones",
      category: "Electronics",
      brand: "Nova",
      price: 8999,
      discountPrice: 6999,
      stock: 45,
      isFeatured: true,
      images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"],
      description: "Over-ear headphones with active noise cancellation and 30-hour battery life.",
    },
    {
      name: "Smart Fitness Watch",
      category: "Electronics",
      brand: "Pulse",
      price: 5499,
      discountPrice: 4299,
      stock: 60,
      isFeatured: true,
      images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"],
      description: "Track heart rate, sleep, and workouts with a 10-day battery life.",
    },
    {
      name: "Classic Cotton T-Shirt",
      category: "Fashion",
      brand: "Urban Edge",
      price: 799,
      discountPrice: null,
      stock: 200,
      isFeatured: false,
      images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"],
      description: "100% breathable cotton, available in multiple colors.",
    },
    {
      name: "Leather Chelsea Boots",
      category: "Fashion",
      brand: "Urban Edge",
      price: 4499,
      discountPrice: 3599,
      stock: 30,
      isFeatured: true,
      images: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800"],
      description: "Genuine leather boots with a comfortable rubber sole.",
    },
    {
      name: "Stainless Steel Cookware Set",
      category: "Home & Kitchen",
      brand: "Everline",
      price: 6999,
      discountPrice: 5499,
      stock: 25,
      isFeatured: false,
      images: ["https://images.unsplash.com/photo-1584990347449-a5d9f800a783?w=800"],
      description: "10-piece set, dishwasher safe, induction compatible.",
    },
    {
      name: "Aromatherapy Diffuser",
      category: "Home & Kitchen",
      brand: "Aurora",
      price: 1899,
      discountPrice: 1499,
      stock: 80,
      isFeatured: false,
      images: ["https://images.unsplash.com/photo-1602928321679-560bb453f190?w=800"],
      description: "Ultrasonic essential oil diffuser with 7-color LED light.",
    },
    {
      name: "Vitamin C Serum",
      category: "Beauty",
      brand: "Aurora",
      price: 1299,
      discountPrice: 999,
      stock: 120,
      isFeatured: true,
      images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800"],
      description: "Brightening serum with hyaluronic acid, 30ml.",
    },
    {
      name: "Yoga Mat Pro",
      category: "Sports",
      brand: "Pulse",
      price: 1999,
      discountPrice: 1599,
      stock: 90,
      isFeatured: false,
      images: ["https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=800"],
      description: "Extra-thick non-slip yoga mat with carry strap.",
    },
    {
      name: "Adjustable Dumbbell Set",
      category: "Sports",
      brand: "Pulse",
      price: 7999,
      discountPrice: null,
      stock: 15,
      isFeatured: false,
      images: ["https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=800"],
      description: "5-25kg adjustable dumbbells, sold as a pair.",
    },
    {
      name: "The Atlas of Forgotten Places",
      category: "Books",
      brand: "Nova",
      price: 599,
      discountPrice: null,
      stock: 150,
      isFeatured: false,
      images: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800"],
      description: "A bestselling novel about journeys across forgotten lands.",
    },
  ];

  let created = 0;
  for (const p of sampleProducts) {
    const exists = await Product.findOne({ name: p.name });
    if (exists) continue;
    await Product.create({
      name: p.name,
      slug: `${slugifyBase(p.name)}-${Math.random().toString(36).slice(2, 6)}`,
      description: p.description,
      price: p.price,
      discountPrice: p.discountPrice,
      images: p.images,
      category: categories.get(p.category)?._id,
      brand: brands.get(p.brand)?._id,
      seller: seller._id,
      stock: p.stock,
      status: "approved",
      isFeatured: p.isFeatured,
    });
    created++;
  }

  // ── Sample coupon ───────────────────────────────────────────────────
  const couponCode = "WELCOME10";
  const existingCoupon = await Coupon.findOne({ code: couponCode });
  if (!existingCoupon) {
    await Coupon.create({
      code: couponCode,
      discountType: "percent",
      discountValue: 10,
      minOrder: 500,
      maxDiscount: 500,
      isActive: true,
    });
  }

  logger.info(
    `Seed complete. Categories: ${categories.size}, Brands: ${brands.size}, Products created: ${created}, Coupon: ${couponCode}`,
  );

  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  logger.error({ err }, "Seed failed");
  process.exit(1);
});
