import { Schema, model, Document, Types } from "mongoose";
import { withJSONId } from "./plugins";

export type UserRole = "buyer" | "seller" | "admin";
export type UserStatus = "active" | "banned";
export type AuthProvider = "local" | "google";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  authProvider: AuthProvider;
  googleId?: string | null;
  otp?: string | null;
  otpExpiresAt?: Date | null;
  resetToken?: string | null;
  resetTokenExpiresAt?: Date | null;
  refreshToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Not required at the schema level: users who sign up with Google never get one.
    passwordHash: { type: String, default: null, select: false },
    phone: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    role: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      default: "buyer",
    },
    status: { type: String, enum: ["active", "banned"], default: "active" },
    isVerified: { type: Boolean, default: false },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, index: true, sparse: true, unique: true },
    otp: { type: String, default: null, select: false },
    otpExpiresAt: { type: Date, default: null },
    resetToken: { type: String, default: null, select: false },
    resetTokenExpiresAt: { type: Date, default: null },
    refreshToken: { type: String, default: null, select: false },
  },
  { timestamps: true },
);

withJSONId(userSchema);

export const User = model<IUser>("User", userSchema);
