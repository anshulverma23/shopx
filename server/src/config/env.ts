import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 3000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  mongodbUri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/shopx"),

  jwtSecret: required("JWT_SECRET", "shopx-dev-secret-change-in-production"),
  jwtRefreshSecret: required(
    "JWT_REFRESH_SECRET",
    "shopx-dev-refresh-secret-change-in-production",
  ),
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",

  googleClientId: process.env.GOOGLE_CLIENT_ID || "",

  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
};

export const isRazorpayConfigured = Boolean(
  env.razorpayKeyId && env.razorpayKeySecret,
);

export const isGoogleAuthConfigured = Boolean(env.googleClientId);
