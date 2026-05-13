import { email } from "zod";
// import prisma from "../../shared/prisma";
// import { IJWTPayload } from "../../shared/types/common";
// import { IPaginationOptions } from "../../shared/types/pagination";
// import { paginationHelper } from "../../helper/paginationHelper";
// import { Prisma } from "@prisma/client";
import { userSearchAbleFields } from "../user/user.constant";
import { tr } from "zod/v4/locales";
import { IJWTPayload } from "../../shared/Types/commonTypes";
import prisma from "../../../config/db";
import { paginationHelper } from "../../helpers/paginationHelper";
import { Prisma } from "../../../generated/client";
import { IPaginationOptions } from "../../shared/Types/Ipagination";
import { massageSearchAbleFields } from "./massage.constant";
import { IAuthUser } from "../../interfaces/common";

interface IMassagePayload {
   name: string;
   description: string;
   email?: string;
   phone?: string;
   subject: string;
}

const massageCreate = async (user: IJWTPayload, payload: IMassagePayload) => {
   // console.log("Request body structure:", payload);
   // if (!req.body) {
   //    throw new Error("Request body is required");

   // }
   // console.log(payload.phone, "user phone");
   const userData = await prisma.user.findUniqueOrThrow({
      where: {
         email: user.email,
      },
   });
   const result = await prisma.massage.create({
      data: {
         name: payload.name,
         userId: userData.id,
         description: payload.description,
         email: payload.email ?? null,
         phone: payload.phone ?? null,
         subject: payload.subject, // Ensure payload.subject is provided
      },
   });
   return result;
};

// const getAllMassages = async () => {
//    const result = await prisma.massage.findMany();
//    return result;
// };
const getAllMassages = async (params: any, options: IPaginationOptions) => {
   const { page, limit, skip } = paginationHelper.calculatePagination({
      ...options,
      sortBy: options.sortBy || "createdAt",
      sortOrder: options.sortOrder || "desc",
   });
   const { searchTerm, ...filterData } = params;

   const andConditions: Prisma.MassageWhereInput[] = [];

   if (params.searchTerm) {
      andConditions.push({
         OR: massageSearchAbleFields.map((field) => ({
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

   const whereConditions: Prisma.MassageWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

   const result = await prisma.massage.findMany({
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
         email: true,
         name: true,
         phone: true,
         subject: true,
         description: true,
         createdAt: true,
         updatedAt: true,
         user: {
            select: {
               createdAt: true,
               email: true,
               id: true,
               name: true,
               profilePhoto: true,
               role: true,
               status: true,
               updatedAt: true,
            },
         },
         admin: {
            select:{
               name: true,
               email: true,
               id:true,
            }
         },
      },
   });

   const total = await prisma.massage.count({
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
const getMassageById = async (id: string) => {
   const result = await prisma.massage.findUnique({
      where: { id },
   });
   return result;
};

const getMyMassages = async (user: IAuthUser, filters: any, options: IPaginationOptions) => {
   const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);
   const { searchTerm } = filters;

   const andConditions: Prisma.MassageWhereInput[] = [{ email: user.email }];

   if (searchTerm) {
      andConditions.push({
         OR: [{ user: { email: { contains: searchTerm, mode: "insensitive" } } }],
      });
   }

   const whereConditions: Prisma.MassageWhereInput = { AND: andConditions };

   const result = await prisma.massage.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
         user: { select: { name: true, email: true } },
      },
   });

   const total = await prisma.massage.count({ where: whereConditions });

   return {
      meta: { total, limit, page },
      data: result,
   };
};

export const massageService = {
   massageCreate,
   getAllMassages,
   getMassageById,
   getMyMassages,
};
