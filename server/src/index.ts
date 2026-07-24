import { createApp } from "./app";
import { connectDB } from "./config/db";
import {
  env,
  isGoogleAuthConfigured,
  isRazorpayConfigured,
} from "./config/env";
import { logger } from "./utils/logger";

async function main() {
  try {
    await connectDB();

    const app = createApp();
    const PORT = env.port;

    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`🚀 ShopX API listening on port ${PORT}`);
      logger.info(`🌐 CORS allowed for: ${env.clientUrl}`);

      if (!isRazorpayConfigured) {
        logger.warn(
          "Razorpay keys not set — online payments are disabled (COD still works).",
        );
      }

      if (!isGoogleAuthConfigured) {
        logger.warn(
          "GOOGLE_CLIENT_ID not set — Google Sign-In is disabled.",
        );
      }
    });
  } catch (err) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
}

main();