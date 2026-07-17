import { Router } from "express";
import crypto from "crypto";
import { Order, Cart } from "../models";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { razorpay } from "../config/razorpay";
import { isRazorpayConfigured, env } from "../config/env";
import { formatOrder } from "./orders";
import { logger } from "../utils/logger";

const router = Router();

function requireRazorpay(req: any, res: any, next: any) {
  if (!isRazorpayConfigured) {
    res.status(503).json({ error: "Online payments are not configured on the server yet" });
    return;
  }
  next();
}

/**
 * (Re)create a Razorpay order for an existing pending order — used when a
 * user abandons the checkout modal and wants to retry payment from the
 * order detail page, instead of placing a duplicate order.
 */
router.post(
  "/payments/razorpay/order/:orderId",
  requireAuth,
  requireRazorpay,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.orderId, user: req.user!.userId });
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (order.paymentMethod !== "razorpay" || order.paymentStatus === "paid") {
      res.status(400).json({ error: "This order is not awaiting online payment" });
      return;
    }

    const razorpayOrder = await razorpay!.orders.create({
      amount: Math.round(order.total * 100),
      currency: "INR",
      receipt: order._id.toString(),
      notes: { orderId: order._id.toString() },
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: env.razorpayKeyId,
    });
  }),
);

router.post(
  "/payments/razorpay/verify",
  requireAuth,
  requireRazorpay,
  asyncHandler(async (req, res) => {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ error: "Missing payment verification fields" });
      return;
    }

    const order = await Order.findOne({ _id: orderId, user: req.user!.userId });
    if (!order || order.razorpayOrderId !== razorpay_order_id) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const expectedSignature = crypto
      .createHmac("sha256", env.razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      res.status(400).json({ error: "Payment verification failed — signature mismatch" });
      return;
    }

    order.paymentStatus = "paid";
    order.status = order.status === "pending" ? "confirmed" : order.status;
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    await order.save();

    await Cart.findOneAndUpdate({ user: req.user!.userId }, { items: [], couponCode: null });

    res.json(formatOrder(order));
  }),
);

/**
 * Optional server-to-server confirmation. Configure this URL in the
 * Razorpay dashboard (Settings -> Webhooks) if you want payment status to be
 * reconciled even when the user never returns to the app after paying.
 */
router.post(
  "/payments/razorpay/webhook",
  asyncHandler(async (req, res) => {
    if (!env.razorpayWebhookSecret) {
      res.status(503).json({ error: "Webhook secret not configured" });
      return;
    }

    const signature = req.headers["x-razorpay-signature"];
    const expected = crypto
      .createHmac("sha256", env.razorpayWebhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (signature !== expected) {
      res.status(400).json({ error: "Invalid webhook signature" });
      return;
    }

    const event = req.body?.event;
    const paymentEntity = req.body?.payload?.payment?.entity;

    if (event === "payment.captured" && paymentEntity?.order_id) {
      const order = await Order.findOne({ razorpayOrderId: paymentEntity.order_id });
      if (order && order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        order.status = order.status === "pending" ? "confirmed" : order.status;
        order.razorpayPaymentId = paymentEntity.id;
        await order.save();
        logger.info({ orderId: order._id.toString() }, "Order marked paid via Razorpay webhook");
      }
    }

    res.json({ received: true });
  }),
);

export default router;
