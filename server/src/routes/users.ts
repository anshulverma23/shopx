import { Router } from "express";
import bcrypt from "bcryptjs";
import { User, Address, IAddress } from "../models";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

function formatUser(user: any) {
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

function formatAddress(a: IAddress) {
  return {
    id: a._id.toString(),
    userId: a.user.toString(),
    name: a.name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 ?? null,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    country: a.country,
    isDefault: a.isDefault,
  };
}

router.get(
  "/users/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(formatUser(user));
  }),
);

router.patch(
  "/users/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, phone, avatarUrl } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      { new: true },
    );
    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(formatUser(user));
  }),
);

router.post(
  "/users/me/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user!.userId).select("+passwordHash");
    if (!user || !user.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password changed" });
  }),
);

// ── Addresses ───────────────────────────────────────────────────────────
router.get(
  "/users/addresses",
  requireAuth,
  asyncHandler(async (req, res) => {
    const addresses = await Address.find({ user: req.user!.userId }).sort({ createdAt: -1 });
    res.json(addresses.map(formatAddress));
  }),
);

router.post(
  "/users/addresses",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, phone, line1, line2, city, state, pincode, country = "India", isDefault = false } = req.body;
    if (!name || !phone || !line1 || !city || !state || !pincode) {
      res.status(400).json({ error: "name, phone, line1, city, state, and pincode are required" });
      return;
    }
    if (isDefault) {
      await Address.updateMany({ user: req.user!.userId }, { isDefault: false });
    }
    const address = await Address.create({
      user: req.user!.userId,
      name,
      phone,
      line1,
      line2: line2 ?? null,
      city,
      state,
      pincode,
      country,
      isDefault,
    });
    res.status(201).json(formatAddress(address));
  }),
);

router.patch(
  "/users/addresses/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, phone, line1, line2, city, state, pincode, country, isDefault } = req.body;
    if (isDefault) {
      await Address.updateMany({ user: req.user!.userId }, { isDefault: false });
    }
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user!.userId },
      {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(line1 && { line1 }),
        ...(line2 !== undefined && { line2 }),
        ...(city && { city }),
        ...(state && { state }),
        ...(pincode && { pincode }),
        ...(country && { country }),
        ...(isDefault !== undefined && { isDefault }),
      },
      { new: true },
    );
    if (!address) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(formatAddress(address));
  }),
);

router.delete(
  "/users/addresses/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    await Address.deleteOne({ _id: req.params.id, user: req.user!.userId });
    res.json({ message: "Address deleted" });
  }),
);

export default router;
