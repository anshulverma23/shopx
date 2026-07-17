import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { User, IUser } from "../models";
import { signTokens, requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { env, isGoogleAuthConfigured } from "../config/env";
import { logger } from "../utils/logger";

const router = Router();

const googleClient = isGoogleAuthConfigured ? new OAuth2Client(env.googleClientId) : null;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatUser(user: IUser) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role,
    isVerified: user.isVerified,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post(
  "/auth/register",
  asyncHandler(async (req, res) => {
    const { name, email, password, role = "buyer" } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "name, email, and password are required" });
      return;
    }
    if (!["buyer", "seller"].includes(role)) {
      res.status(400).json({ error: "role must be 'buyer' or 'seller'" });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      otp,
      otpExpiresAt,
      authProvider: "local",
    });

    const { accessToken, refreshToken } = signTokens(user._id.toString(), user.role);
    user.refreshToken = refreshToken;
    await user.save();

    logger.info({ userId: user._id.toString(), otp }, "User registered — OTP generated for development");

    res.status(201).json({ accessToken, refreshToken, user: formatUser(user) });
  }),
);

router.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "email and password required" });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (user.status === "banned") {
      res.status(403).json({ error: "Account is banned" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const { accessToken, refreshToken } = signTokens(user._id.toString(), user.role);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken, user: formatUser(user) });
  }),
);

router.post(
  "/auth/google",
  asyncHandler(async (req, res) => {
    if (!googleClient) {
      res.status(503).json({ error: "Google Sign-In is not configured on the server" });
      return;
    }

    const { credential, role } = req.body;
    if (!credential) {
      res.status(400).json({ error: "credential is required" });
      return;
    }
    // Only ever trust this for brand-new accounts (see below) and only allow
    // the same two self-serve roles the regular /auth/register endpoint
    // allows — never "admin", and never applied to an existing account.
    const requestedRole = role === "seller" ? "seller" : "buyer";

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: env.googleClientId,
      });
      payload = ticket.getPayload();
} catch (err) {
  console.error("Google verify error:", err);
  res.status(401).json({ error: "Invalid Google credential" });
  return;
}

    if (!payload?.email) {
      res.status(401).json({ error: "Google account has no verified email" });
      return;
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ email });

    if (user) {
      if (user.status === "banned") {
        res.status(403).json({ error: "Account is banned" });
        return;
      }
      // Link the Google account to an existing local account on first Google login.
      if (!user.googleId) {
        user.googleId = payload.sub;
        if (payload.picture && !user.avatarUrl) user.avatarUrl = payload.picture;
      }
      user.isVerified = true;
    } else {
      user = new User({
        name: payload.name || email.split("@")[0],
        email,
        googleId: payload.sub,
        avatarUrl: payload.picture ?? null,
        authProvider: "google",
        isVerified: true,
        role: requestedRole,
      });
    }

    const { accessToken, refreshToken } = signTokens(user._id.toString(), user.role);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken, user: formatUser(user) });
  }),
);

router.post(
  "/auth/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user!.userId, { refreshToken: null });
    res.json({ message: "Logged out" });
  }),
);

router.post(
  "/auth/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: "refreshToken required" });
      return;
    }
    try {
      const payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as {
        userId: string;
        role: string;
      };
      const user = await User.findById(payload.userId).select("+refreshToken");
      if (!user || user.refreshToken !== refreshToken) {
        res.status(401).json({ error: "Invalid refresh token" });
        return;
      }
      const tokens = signTokens(user._id.toString(), user.role);
      user.refreshToken = tokens.refreshToken;
      await user.save();
      res.json({ ...tokens, user: formatUser(user) });
    } catch {
      res.status(401).json({ error: "Invalid refresh token" });
    }
  }),
);

router.post(
  "/auth/verify-otp",
  asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() }).select("+otp");
    if (!user || user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      res.status(400).json({ error: "Invalid or expired OTP" });
      return;
    }
    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();
    res.json({ message: "Email verified" });
  }),
);

router.post(
  "/auth/resend-otp",
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) {
      res.json({ message: "If that email exists, an OTP was sent" });
      return;
    }
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    logger.info({ otp }, "OTP resent for development");
    res.json({ message: "OTP sent" });
  }),
);

router.post(
  "/auth/forgot-password",
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      user.resetToken = resetToken;
      user.resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      logger.info({ resetToken }, "Password reset token generated for development");
    }
    res.json({ message: "If that email exists, a reset link was sent" });
  }),
);

router.post(
  "/auth/reset-password",
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const user = await User.findOne({ resetToken: token }).select("+resetToken");
    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }
    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetTokenExpiresAt = null;
    await user.save();
    res.json({ message: "Password reset successfully" });
  }),
);

export default router;
