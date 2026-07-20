import { Router } from "express";
import ImageKit from "@imagekit/nodejs";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { env, isImageKitConfigured } from "../config/env";

const router = Router();

// Lazily initialize so the server still starts if ImageKit is not configured
let imagekit: ImageKit | null = null;

function getImageKit(): ImageKit {
  if (!imagekit) {
    imagekit = new ImageKit({
      privateKey: env.imagekitPrivateKey,
      baseURL: env.imagekitUrlEndpoint, // The new SDK uses baseURL for urlEndpoint
    });
  }
  return imagekit;
}

/**
 * GET /api/imagekit/auth
 *
 * Returns a short-lived authentication payload {token, expire, signature}
 * that the browser uses to upload images directly to ImageKit without
 * exposing the private key in client-side code.
 *
 * The endpoint is protected — only authenticated users can request auth
 * params, preventing anonymous uploads to the account.
 */
router.get(
  "/imagekit/auth",
  requireAuth,
  asyncHandler(async (_req, res) => {
    // Prevent browser caching of the auth payload
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    if (!isImageKitConfigured) {
      res.status(503).json({
        error:
          "ImageKit is not configured on the server. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT in server/.env.",
      });
      return;
    }

    const authParams = getImageKit().helper.getAuthenticationParameters();
    res.json({
      ...authParams,
      publicKey: env.imagekitPublicKey,
      urlEndpoint: env.imagekitUrlEndpoint,
    });
  }),
);

export default router;
