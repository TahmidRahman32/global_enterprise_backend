// src/app/modules/review/review.route.ts

import express from "express";
import { ReviewController } from "./review.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get("/all", ReviewController.getAllReviews);
router.post("/create", auth(), ReviewController.createReview);
router.get("/:productId", ReviewController.getReviewsByProductId);

export const ReviewRoutes = router;
