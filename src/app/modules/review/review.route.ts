// src/app/modules/review/review.route.ts

import express from "express";
import { ReviewController } from "./review.controller";
import auth from "../../middlewares/auth";
import { userRole } from "../../../generated/enums";

const router = express.Router();

router.get("/all", ReviewController.getAllReviews);
router.post("/create", auth(userRole.USER, userRole.ADMIN), ReviewController.createReview);
router.get("/:productId",auth(userRole.USER, userRole.ADMIN), ReviewController.getReviewsByProductId);

export const ReviewRoutes = router;
