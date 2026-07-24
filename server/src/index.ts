import { createApp } from "./app";
import { connectDB } from "./config/db";
import { env, isRazorpayConfigured, isGoogleAuthConfigured } from "./config/env";
import { logger } from "./utils/logger";

async function main() {
  await connectDB();

  const app = createApp();

  app.listen(env.port, () => {
    logger.info(`ShopX API listening on http://localhost:${env.port}`);
    logger.info(`CORS allowed for: ${env.clientUrl}`);
    if (!isRazorpayConfigured) {
      logger.warn("Razorpay keys not set — online payments are disabled (COD still works). See .env.example");
    }
    if (!isGoogleAuthConfigured) {
      logger.warn("GOOGLE_CLIENT_ID not set — Google Sign-In is disabled. See .env.example");
    }
  });
}

main().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
