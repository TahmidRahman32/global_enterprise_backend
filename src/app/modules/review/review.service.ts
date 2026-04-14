import prisma from "../../../config/db";
import { Prisma } from "../../../generated/client";
import { paginationHelper } from "../../helpers/paginationHelper";
import { IJWTPayload } from "../../shared/Types/commonTypes";
import { IPaginationOptions } from "../../shared/Types/Ipagination";
import { reviewSearchAbleFields } from "./review.constant";

interface IReviewPayload {
   comment: string;
   position: string;
   rating: number;
   productId: string;
}

const createReview = async (user: IJWTPayload, payload: IReviewPayload) => {
   const userData = await prisma.user.findUniqueOrThrow({
      where: {
         email: user.email,
      },
   });

   await prisma.product.findUniqueOrThrow({
      where: { id: payload.productId },
   });

   const result = await prisma.review.create({
      data: {
         comment: payload.comment,
         position: payload.position,
         rating: payload.rating,
         userId: userData.id, // Assuming you have a productId in the payload
         productId: payload.productId,
         // Assuming you have a productId in the payload
      },
   });
   return result;
};

const getReviewsByProductId = async (productId: string) => {
   const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
         user: {
            select: {
               name: true,
               email: true,
            },
         },
      },
   });
   return reviews;
};

const getAllReviews = async (params: any, options: IPaginationOptions) => {
   const { page, limit, skip,} = paginationHelper.calculatePagination({
      ...options,
      sortBy: options.sortBy || "createdAt",
      sortOrder: options.sortOrder || "desc",
   });
   const { searchTerm, ...filterData } = params;

   const andConditions: Prisma.ReviewWhereInput[] = [];

   if (params.searchTerm) {
      andConditions.push({
         OR: reviewSearchAbleFields.map((field) => ({
            [field]: {
               contains: params.searchTerm,
               mode: "insensitive",
            },
         })),
      });
   }

   if (Object.keys(filterData).length > 0) {
      andConditions.push({
         AND: Object.keys(filterData).map((key) => ({
            [key]: {
               equals: (filterData as any)[key],
            },
         })),
      });
   }

   const whereConditions: Prisma.ReviewWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

   const result = await prisma.review.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy:
         options.sortBy && options.sortOrder
            ? {
                 [options.sortBy]: options.sortOrder,
              }
            : {
                 createdAt: "desc",
              },
      select: {
         id: true,
         comment: true,
         position: true,
         rating: true,
         createdAt: true,
         updatedAt: true,
         user: true,
      },
   });

   const total = await prisma.review.count({
      where: whereConditions,
   });

   return {
      meta: {
         page,
         limit,
         total,
      },
      data: result,
   };
};

export const ReviewService = { createReview, getReviewsByProductId, getAllReviews };
