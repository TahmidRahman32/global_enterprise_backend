import { Request } from "express";
// import { fileUploader } from "../../helper/fileUploader";
// import prisma from "../../shared/prisma";
// import { fileUploader } from "../../helper/fileUploader";
// import { IOptions, paginationHelper } from "../../helper/paginationHelper";
// import { Prisma } from "@prisma/client";
import { productSearchAbleFields, userSearchAbleFields } from "../user/user.constant";
import { fileUploader } from "../../helpers/fileUploader";
import prisma from "../../../config/db";
import { IOptions, paginationHelper } from "../../helpers/paginationHelper";
import { Prisma } from "../../../generated/client";

const createProduct = async (req: Request) => {
   // console.log("Request body structure:", req.body);

   if (req.file) {
      const uploadResult = await fileUploader.uploadToCloudinary(req.file);

      const result = await prisma.product.create({
         data: {
            name: req.body.name,
            picture: uploadResult?.secure_url,
            sku: "SKU-" + Date.now(),
            price: req.body.price,
            stock: req.body.stock,
            description: req.body.description,
            brand: req.body.brand,
            category: req.body.category,
            note: req.body.note || null,
         },
      });

      return result;
   } else {
      throw new Error("No file uploaded");
   }
};
const getAllProducts = async (params: any, options: IOptions) => {
   const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);
   const { searchTerm, ...filterData } = params;

   const andConditions: Prisma.ProductWhereInput[] = [];

   if (searchTerm) {
      andConditions.push({
         OR: productSearchAbleFields.map((field) => ({
            [field]: {
               contains: searchTerm,
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

   const whereConditions: Prisma.ProductWhereInput =
      andConditions.length > 0
         ? {
              AND: andConditions,
           }
         : {};

   const result = await prisma.product.findMany({
      skip,
      take: limit,

      where: whereConditions,
      orderBy: {
         [sortBy]: sortOrder,
      },
   });

   const total = await prisma.product.count({
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

const getProductById = async (id: string) => {
   const result = await prisma.product.findUnique({
      where: {
         id,
      },
   });
   return result;
};

const deleteFromDB = async (id: string) => {
   const result = await prisma.product.delete({
      where: {
         id,
      },
   });
   return result;
};

export const productService = {
   createProduct,
   getAllProducts,
   deleteFromDB,
   getProductById,
};
