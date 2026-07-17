import { Router } from "express";
import { Order, Cart, Address, Coupon, Product, IOrder } from "../models";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { razorpay } from "../config/razorpay";
import { isRazorpayConfigured, env } from "../config/env";

const router = Router();

function formatOrder(o: IOrder) {
  return {
    id: o._id.toString(),
    userId: o.user.toString(),
    items: o.items.map((i) => ({
      productId: i.product.toString(),
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      imageUrl: i.imageUrl ?? null,
      sellerId: i.sellerId ? i.sellerId.toString() : null,
    })),
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    subtotal: o.subtotal,
    discount: o.discount,
    total: o.total,
    address: o.addressSnapshot,
    couponCode: o.couponCode ?? null,
    trackingNumber: o.trackingNumber ?? null,
    notes: o.notes ?? null,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

router.get(
  "/orders",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    const where: Record<string, unknown> = { user: req.user!.userId };
    if (status) where.status = status;
    const orders = await Order.find(where).sort({ createdAt: -1 });
    res.json(orders.map(formatOrder));
  }),
);

router.post(
  "/orders",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { addressId, paymentMethod = "cod", notes } = req.body;

    if (!["cod", "razorpay"].includes(paymentMethod)) {
      res.status(400).json({ error: "paymentMethod must be 'cod' or 'razorpay'" });
      return;
    }
    if (paymentMethod === "razorpay" && !isRazorpayConfigured) {
      res.status(503).json({ error: "Online payments are not configured on the server yet" });
      return;
    }

    const address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) {
      res.status(400).json({ error: "Address not found" });
      return;
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    const items = cart.items;
    const subtotal = items.reduce((s, i) => s + (i.discountPrice ?? i.price) * i.quantity, 0);
    let discount = 0;
    let couponCode: string | null = null;
    if (cart.couponCode) {
      const coupon = await Coupon.findOne({ code: cart.couponCode });
      if (coupon && coupon.isActive) {
        couponCode = coupon.code;
        if (coupon.discountType === "percent") {
          discount = (subtotal * Number(coupon.discountValue)) / 100;
          if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
        } else {
          discount = Number(coupon.discountValue);
        }
      }
    }
    const total = Math.max(0, subtotal - discount);

    // Look up each item's seller so order items carry an accurate sellerId
    // (used by seller dashboards to attribute sales).
    const products = await Product.find({ _id: { $in: items.map((i) => i.product) } }).select("seller");
    const sellerByProduct = new Map(products.map((p) => [p._id.toString(), p.seller]));

    const orderItems = items.map((i) => ({
      product: i.product,
      name: i.name,
      price: i.discountPrice ?? i.price,
      quantity: i.quantity,
      imageUrl: i.images?.[0] ?? null,
      sellerId: sellerByProduct.get(i.product.toString()) ?? null,
    }));

    const addressSnapshot = {
      id: address._id.toString(),
      name: address.name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? null,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
    };

    const order = await Order.create({
      user: userId,
      items: orderItems,
      status: "pending",
      paymentMethod,
      paymentStatus: "pending",
      subtotal,
      discount,
      total,
      addressSnapshot,
      couponCode,
      notes: notes ?? null,
    });

    if (paymentMethod === "cod") {
      await Cart.findOneAndUpdate({ user: userId }, { items: [], couponCode: null });
      res.status(201).json(formatOrder(order));
      return;
    }

    // Razorpay: create the corresponding payment order and return checkout details.
    // The cart is intentionally left intact until payment is verified, so the
    // user can retry if they close the checkout modal.
    const razorpayOrder = await razorpay!.orders.create({
      amount: Math.round(total * 100), // paise
      currency: "INR",
      receipt: order._id.toString(),
      notes: { orderId: order._id.toString() },
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.status(201).json({
      ...formatOrder(order),
      razorpay: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: env.razorpayKeyId,
      },
    });
  }),
);

router.get(
  "/orders/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const where: Record<string, unknown> =
      req.user!.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, user: req.user!.userId };
    const order = await Order.findOne(where);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(formatOrder(order));
  }),
);

router.post(
  "/orders/:id/cancel",
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user!.userId });
    if (!order) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!["pending", "confirmed"].includes(order.status)) {
      res.status(400).json({ error: "Cannot cancel this order" });
      return;
    }
    order.status = "cancelled";
    await order.save();
    res.json(formatOrder(order));
  }),
);

router.post(
  "/orders/:id/return",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: req.user!.userId });
    if (!order) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (order.status !== "delivered") {
      res.status(400).json({ error: "Only delivered orders can be returned" });
      return;
    }
    order.status = "returned";
    if (reason) {
      order.notes = order.notes ? `${order.notes} | Return reason: ${reason}` : `Return reason: ${reason}`;
    }
    await order.save();
    res.json(formatOrder(order));
  }),
);

export default router;
export { formatOrder };
