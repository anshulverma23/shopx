import { Router } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import brandsRouter from "./brands";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import reviewsRouter from "./reviews";
import wishlistRouter from "./wishlist";
import sellersRouter from "./sellers";
import adminRouter from "./admin";
import paymentsRouter from "./payments";
import imagekitRouter from "./imagekit";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(brandsRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(reviewsRouter);
router.use(wishlistRouter);
router.use(sellersRouter);
router.use(adminRouter);
router.use(paymentsRouter);
router.use(imagekitRouter);

export default router;
