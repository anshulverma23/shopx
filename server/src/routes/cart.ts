import { Router } from "express";
import { Response } from "express";
import { Cart, Product, Coupon, ICart, ICartItem, ICoupon } from "../models";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

async function getOrCreateCart(userId: string): Promise<ICart> {
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { new: true, upsert: true }
  );
  return cart;
}

function computeCart(items: ICartItem[], coupon?: ICoupon | null) {
  const subtotal = items.reduce((sum, i) => sum + (i.discountPrice ?? i.price) * i.quantity, 0);
  let discount = 0;
  if (coupon) {
    if (coupon.discountType === "percent") {
      discount = Math.round(((subtotal * Number(coupon.discountValue)) / 100) * 100) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
    } else {
      discount = Number(coupon.discountValue);
    }
  }
  const total = Math.max(0, subtotal - discount);
  return { subtotal, discount, total };
}

async function respondCart(res: Response, cart: ICart) {
  const items = cart.items ?? [];
  const couponCode = cart.couponCode ?? null;
  let coupon: ICoupon | null = null;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode });
  }
  const { subtotal, discount, total } = computeCart(items, coupon);
  res.json({
    items: items.map((i) => ({
      productId: i.product.toString(),
      name: i.name,
      price: i.price,
      discountPrice: i.discountPrice ?? null,
      quantity: i.quantity,
      images: i.images ?? [],
      stock: i.stock,
    })),
    subtotal,
    discount,
    total,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    couponCode,
  });
}

router.get(
  "/cart",
  requireAuth,
  asyncHandler(async (req, res) => {
    const cart = await getOrCreateCart(req.user!.userId);
    await respondCart(res, cart);
  }),
);

router.post(
  "/cart/items",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;
    if (!productId || !quantity || quantity < 1) {
      res.status(400).json({ error: "productId and a positive quantity are required" });
      return;
    }
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    if (product.stock < 1) {
      res.status(400).json({ error: "Product is out of stock" });
      return;
    }

    const cart = await getOrCreateCart(req.user!.userId);
    const idx = cart.items.findIndex((i) => i.product.toString() === productId);
    if (idx >= 0) {
      cart.items[idx].quantity = Math.min(cart.items[idx].quantity + quantity, product.stock);
    } else {
      cart.items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice ?? null,
        quantity: Math.min(quantity, product.stock),
        images: product.images ?? [],
        stock: product.stock,
      });
    }
    await cart.save();
    await respondCart(res, cart);
  }),
);

router.patch(
  "/cart/items/:productId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;
    const cart = await getOrCreateCart(req.user!.userId);
    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.product.toString() !== productId) as any;
    } else {
      const idx = cart.items.findIndex((i) => i.product.toString() === productId);
      if (idx >= 0) cart.items[idx].quantity = quantity;
    }
    await cart.save();
    await respondCart(res, cart);
  }),
);

router.delete(
  "/cart/items/:productId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const cart = await getOrCreateCart(req.user!.userId);
    cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId) as any;
    await cart.save();
    await respondCart(res, cart);
  }),
);

router.post(
  "/cart/coupon",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code: String(code).toUpperCase() });
    if (!coupon || !coupon.isActive || (coupon.expiresAt && coupon.expiresAt < new Date())) {
      res.status(400).json({ error: "Invalid or expired coupon" });
      return;
    }
    const cart = await getOrCreateCart(req.user!.userId);
    cart.couponCode = coupon.code;
    await cart.save();
    await respondCart(res, cart);
  }),
);

router.delete(
  "/cart/coupon",
  requireAuth,
  asyncHandler(async (req, res) => {
    const cart = await getOrCreateCart(req.user!.userId);
    cart.couponCode = null;
    await cart.save();
    await respondCart(res, cart);
  }),
);

router.delete(
  "/cart/clear",
  requireAuth,
  asyncHandler(async (req, res) => {
    await Cart.findOneAndUpdate({ user: req.user!.userId }, { items: [], couponCode: null });
    res.json({ message: "Cart cleared" });
  }),
);

export default router;
export { getOrCreateCart };
