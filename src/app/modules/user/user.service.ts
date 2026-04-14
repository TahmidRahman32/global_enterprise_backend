import config from "../../../config";
import bcrypt from "bcryptjs";
// import { IOptions, paginationHelper } from "../../helper/paginationHelper";
// import { userSearchAbleFields } from "./user.constant";
// import prisma from "../../shared/prisma";
// import { Prisma, userRole, userStatus } from "@prisma/client";
// import { IJWTPayload } from "../../shared/types/common";
// import { fileUploader } from "../../helper/fileUploader";
// import { UpdateProfileData } from "../../shared/types/userFileType";
import { Request } from "express";
import prisma from "../../../config/db";
import { IOptions, paginationHelper } from "../../helpers/paginationHelper";
import { Prisma, userRole, userStatus } from "../../../generated/client";
import { userSearchAbleFields } from "./user.constant";
import { IJWTPayload } from "../../shared/Types/commonTypes";
import { fileUploader } from "../../helpers/fileUploader";
import { UploadedFile } from "../../shared/Types/UploadedFile";
interface CreateUserData {
   name: string;
   email: string;
   password: string;
   profilePhoto?: string;
}

const createUser = async (userData: CreateUserData) => {
   if (!userData.name || !userData.email || !userData.password) {
      throw new Error("Missing required fields");
   }

   // Validate email format
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!emailRegex.test(userData.email)) {
      throw new Error("Invalid email format");
   }

   // Validate password strength
   if (userData.password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
   }

   // Check if user already exists
   const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
   });

   if (existingUser) {
      throw new Error("User with this email already exists");
   }

   // Hash password
   const hashPassword = await bcrypt.hash(userData.password, Number(config.salt_round));

   // Create user
   const result = await prisma.user.create({
      data: {
         name: userData.name,
         email: userData.email,
         password: hashPassword,
         ...(userData.profilePhoto && { profilePhoto: userData.profilePhoto }),
      },
      select: {
         // Only return necessary fields (exclude password)
         id: true,
         name: true,
         email: true,
         profilePhoto: true,
      },
   });

   return result;
};

const getAllUser = async (params: any, options: IOptions) => {
   const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);
   const { searchTerm, ...filterData } = params;

   const andConditions: Prisma.UserWhereInput[] = [];

   if (searchTerm) {
      andConditions.push({
         OR: userSearchAbleFields.map((field) => ({
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

   const whereConditions: Prisma.UserWhereInput =
      andConditions.length > 0
         ? {
              AND: andConditions,
           }
         : {};

   const result = await prisma.user.findMany({
      skip,
      take: limit,

      where: whereConditions,
      orderBy: {
         [sortBy]: sortOrder,
      },
   });

   const total = await prisma.user.count({
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

const getMyProfile = async (user: IJWTPayload) => {
   const userInfo = await prisma.user.findUniqueOrThrow({
      where: {
         email: user.email,
         status: userStatus.ACTIVE,
      },
      select: {
         id: true,
         email: true,
         needPasswordChange: true,
         role: true,
         status: true,
      },
   });

   let profileData;

   if (userInfo.role === userRole.USER) {
      profileData = await prisma.user.findUnique({
         where: {
            email: userInfo.email,
         },
      });
   } else if (userInfo.role === userRole.ADMIN) {
      profileData = await prisma.admin.findUnique({
         where: {
            email: userInfo.email,
         },
      });
   } else if (userInfo.role === userRole.SUPER_ADMIN) {
      profileData = await prisma.admin.findUnique({
         where: {
            email: userInfo.email,
         },
      });
   }

   return {
      ...userInfo,
      ...profileData,
   };
};

const updateMyProfile = async (user: IJWTPayload, req: Request & { file?: UploadedFile }) => {
   const userInfo = await prisma.user.findUniqueOrThrow({
      where: {
         email: user?.email,
         status: userStatus.ACTIVE,
      },
   });

   const file = req.file;
   if (file) {
      const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
      req.body.profilePhoto = uploadToCloudinary?.secure_url;
   }

   let profileInfo;

   if (userInfo.role === userRole.ADMIN) {
      profileInfo = await prisma.admin.update({
         where: {
            email: userInfo.email,
         },
         data: req.body,
      });
   } else if (userInfo.role === userRole.USER) {
      profileInfo = await prisma.user.update({
         where: {
            email: userInfo.email,
         },
         data: req.body,
      });
   }

   return { ...profileInfo };
};

export const userService = {
   createUser,
   getAllUser,
   getMyProfile,
   updateMyProfile,
};
