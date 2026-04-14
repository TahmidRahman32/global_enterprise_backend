import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { ReviewService } from "./review.service";
import pick from "../../helpers/pick";
import httpStatus from "http-status";
import { reviewFilterableFields } from "./review.constant";

export interface CustomRequest extends Request {
   user?: any;
}

const createReview = catchAsync(async (req: CustomRequest, res: Response) => {
   const user = req.user; // assumes auth middleware sets req.user
   const payload = req.body;

   const result = await ReviewService.createReview(user, payload);

   sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Review created successfully",
      data: result,
   });
});

const getReviewsByProductId = catchAsync(async (req: Request, res: Response) => {
   const { productId } = req.params;

   const reviews = await ReviewService.getReviewsByProductId(productId as string);

   sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Reviews retrieved successfully",
      data: reviews,
   });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
   const filters = pick(req.query, reviewFilterableFields);
   const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

   const result = await ReviewService.getAllReviews(filters, options);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Users data fetched!",
      meta: result.meta,
      data: result.data,
   });
});

export const ReviewController = { createReview, getReviewsByProductId, getAllReviews };
