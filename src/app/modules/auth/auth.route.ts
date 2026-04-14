import express from "express";
import { AuthController } from "./auth.controller";
import auth from "../../middlewares/auth";
import { userRole } from "../../../generated/browser";


const router = express.Router();

router.get("/me", AuthController.getMe);

router.post("/login", AuthController.login);

router.post("/refresh-token", AuthController.refreshToken);

router.post("/change-password", auth(userRole.ADMIN, userRole.USER), AuthController.changePassword);

router.post("/forgot-password", AuthController.forgotPassword);

router.post("/reset-password", AuthController.resetPassword);

export const authRoutes = router;
