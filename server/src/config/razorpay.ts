import Razorpay from "razorpay";
import { env, isRazorpayConfigured } from "./env";

// The Razorpay instance is only created when keys are configured. Routes
// that need it check `isRazorpayConfigured` first and return a clear 503
// error otherwise, so the rest of the app works fine without payment keys
// set up (e.g. while developing the catalog/cart/orders features).
export const razorpay: Razorpay | null = isRazorpayConfigured
  ? new Razorpay({
      key_id: env.razorpayKeyId,
      key_secret: env.razorpayKeySecret,
    })
  : null;
