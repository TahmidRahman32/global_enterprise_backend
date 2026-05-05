import express from "express";
import { userRouter } from "../modules/user/user.route";
import { authRoutes } from "../modules/auth/auth.route";
import { ProductRoutes } from "../modules/product/product.route";
import { MassageRoutes } from "../modules/massage/massage.route";
import { ReviewRoutes } from "../modules/review/review.route";
import { orderRoutes } from "../modules/order/order.route";

const router = express.Router();

const moduleRoutes = [
   {
      path: "/user",
      route: userRouter,
   },
   {
      path: "/auth",
      route: authRoutes,
   },
   {
      path: "/product",
      route: ProductRoutes,
   },

   {
      path: "/massage",
      route: MassageRoutes,
   },
  
   {
      path: "/review",
      route: ReviewRoutes,
   },
   {
      path: "/order",
      route: orderRoutes,
   },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
