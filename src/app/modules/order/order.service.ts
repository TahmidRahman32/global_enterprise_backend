import { success } from "zod";
import prisma from "../../../config/db";
import { OrderStatus, Prisma, userRole } from "../../../generated/client";
import { IJWTPayload } from "../../shared/Types/commonTypes";
import { IPaginationOptions } from "../../shared/Types/Ipagination";
import { paginationHelper } from "../../helpers/paginationHelper";
import { massageSearchAbleFields, orderSearchAbleFields } from "../massage/massage.constant";
import { IOrderFromUpdatePayload, IOrderPayload, IOrderUpdatePayload } from "./order.constant";
import { IAuthUser } from "../../interfaces/common";

const OrderCreate = async (user: IJWTPayload, payload: IOrderPayload) => {
   try {
      // 1. Fetch user
      const userData = await prisma.user.findUniqueOrThrow({
         where: { email: user.email },
      });

      // 2. Fetch product
      const productData = await prisma.product.findFirstOrThrow({
         where: { id: payload.productId },
      });

      // 3. 🔥 DUPLICATE CHECK – Find any existing pending order for this user that includes the same product
      const existingOrder = await prisma.order.findFirst({
         where: {
            userId: userData.id,
            status: "PENDING", // 👈 you must have a `status` field in your Order model
            product: {
               some: { id: payload.productId }, // same product already in order
            },
         },
         include: { product: true }, // to compare product list if more than one product later
      });

      // If you later support multiple products, compare full product list:
      // if (existingOrder && sameProductList(existingOrder.product, [productData])) {
      if (existingOrder) {
         // Duplicate order detected – return existing order instead of creating new one
         return {
            success: false,
            warning: "Duplicate order detected",
            massage: "Your order is already completed!!",

            existingOrder,
         };
      }

      // 4. No duplicate – create new order
      const result = await prisma.order.create({
         data: {
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            address: payload.address,
            company: payload.company ?? "",
            status: "PENDING", // set initial status
            user: { connect: { id: userData.id } },
            product: { connect: [{ id: productData.id }] },
         },
         include: {
            product: true,
            user: { select: { id: true, email: true, name: true } },
         },
      });

      return result;
   } catch (error) {
      // Handle Prisma errors as before
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
         if (error.code === "P2025") {
            throw new Error("User or product not found.");
         }
         if (error.code === "P2003") {
            throw new Error("Invalid user or product ID.");
         }
      }
      console.error("Order creation failed:", error);
      throw new Error("An unexpected error occurred.");
   }
};

const getAllOrders = async (params: any, options: IPaginationOptions) => {
   const { page, limit, skip } = paginationHelper.calculatePagination({
      ...options,
      sortBy: options.sortBy || "createdAt",
      sortOrder: options.sortOrder || "desc",
   });
   const { searchTerm, ...filterData } = params;

   const andConditions: Prisma.OrderWhereInput[] = [];

   if (params.searchTerm) {
      andConditions.push({
         OR: orderSearchAbleFields.map((field) => ({
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

   const whereConditions: Prisma.OrderWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

   const result = await prisma.order.findMany({
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
         status: true,
         createdAt: true,
         company: true,
         updatedAt: true,
         address: true,
         user: true,
         product: true,
      },
   });

   const total = await prisma.order.count({
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

const DeleteOrder = async (id: string) => {
   const result = await prisma.order.delete({
      where: { id },
   });
   return result;
};
// Interface for update payload – only status is required, but you could add more fields later

const UpdateOrderStatus = async (id: string, payload: IOrderUpdatePayload) => {
   try {
      // 1. Check if order exists
      const existingOrder = await prisma.order.findUnique({
         where: { id },
      });

      if (!existingOrder) {
         throw new Error(`Order with id ${id} not found`);
      }

      // 2. Validate status value (optional but recommended)
      //  const allowedStatuses = OrderStatus
      //  if (!allowedStatuses.includes(payload.status)) {
      //    throw new Error(`Invalid status. Allowed values: ${allowedStatuses.join(", ")}`);
      //  }

      // 3. Prevent updating completed/cancelled orders (optional business rule)
      // if (existingOrder.status === OrderStatus.PENDING || existingOrder.status === OrderStatus.COMPLETED) {
      //    throw new Error(`Cannot update order with status "${existingOrder.status}"`);
      // }

      // 4. Update the order
      const updatedOrder = await prisma.order.update({
         where: { id },
         data: {
            status: payload.status as OrderStatus,
         },
         select: {
            status: true,
         },
      });

      return updatedOrder;
   } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
         if (error.code === "P2025") {
            throw new Error(`Order with id ${id} not found`);
         }
      }
      throw error; 
   }
};

const UpdateOrderFrom = async (id: string, payload: IOrderFromUpdatePayload) => {
   try {
      // 1. Check if order exists
      const existingOrder = await prisma.order.findUnique({
         where: { id },
      });

      if (!existingOrder) {
         throw new Error(`Order with id ${id} not found`);
      }

      // 2. Validate status value (optional but recommended)
      //  const allowedStatuses = OrderStatus
      //  if (!allowedStatuses.includes(payload.status)) {
      //    throw new Error(`Invalid status. Allowed values: ${allowedStatuses.join(", ")}`);
      //  }

      // 3. Prevent updating completed/cancelled orders (optional business rule)
      if (existingOrder.status === OrderStatus.COMPLETED || existingOrder.status === OrderStatus.CANCELLED) {
         throw new Error(`Cannot update order from is "${existingOrder.status}"`);
      }

      // 4. Update the order
      const updatedOrder = await prisma.order.update({
         where: { id },
         data: {
            name: payload.name,
            phone: payload.phone,
            address: payload.address,
         },
         include: {
            product: true, // include related products if needed
            user: {
               select: { id: true, email: true, name: true },
            },
         },
      });

      return updatedOrder;
   } catch (error) {
      // Handle Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
         if (error.code === "P2025") {
            throw new Error(`Order with id ${id} not found`);
         }
      }
      throw error; // rethrow other errors
   }
};

 

const getMyOrders = async (user: IAuthUser, filters: any, options: IPaginationOptions) => {
   const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);
   const { ...filterData } = filters;

   const andConditions: Prisma.OrderWhereInput[] = [];


   if (user?.role === userRole.USER) {
      andConditions.push({
         userId: user.email, 
      });
   } else if (user?.role === userRole.ADMIN) {
  
   }
   if (Object.keys(filterData).length > 0) {
      for (const [key, value] of Object.entries(filterData)) {
         andConditions.push({
            [key]: { equals: value },
         });
      }
   }

   const whereConditions: Prisma.OrderWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

   const result = await prisma.order.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: {
         [sortBy]: sortOrder,
      },
      include: {
         user: {
            select: {
               name: true,
               email: true,
            },
         },
         product: {
            select: {
               name: true,
               picture: true,
            },
         },
      },
   });

   const total = await prisma.order.count({
      where: whereConditions,
   });

   return {
      meta: {
         total,
         limit,
         page,
      },
      data: result,
   };
};

export const orderService = {
   OrderCreate,
   DeleteOrder,
   getAllOrders,
   UpdateOrderStatus,
   UpdateOrderFrom,
   getMyOrders,
};

// one order but many products

// interface IOrderPayload {
//    name: string;
//    email: string;
//    phone: string;
//    address: string;
//    company?: string;
//    products: {
//       // 👈 array instead of single productId
//       id: string; // product ID
//       quantity: number; // how many of this product
//    }[];
// }

// const OrderCreate = async (user: IJWTPayload, payload: IOrderPayload) => {
//    const userData = await prisma.user.findUniqueOrThrow({
//       where: { email: user.email },
//    });

//    // Validate all products exist and fetch current prices
//    const productIds = payload.products.map((p) => p.id);
//    const products = await prisma.product.findMany({
//       where: { id: { in: productIds } },
//    });
//    if (products.length !== productIds.length) {
//       throw new Error("One or more products not found");
//    }

//    // Create order and order items in a transaction
//    const result = await prisma.$transaction(async (prisma) => {
//       // 1. Create the order
//       const order = await prisma.order.create({
//          data: {
//             name: payload.name,
//             email: payload.email,
//             phone: payload.phone,
//             address: payload.address,
//             company: payload.company ?? "",
//             user: { connect: { id: userData.id } },
//          },
//       });

//       // 2. Create order items for each product
//       const orderItemsData = payload.products.map((item) => {
//          const product = products.find((p) => p.id === item.id);
//          if (!product) throw new Error(`Product ${item.id} not found`);
//          return {
//             orderId: order.id,
//             productId: item.id,
//             quantity: item.quantity,
//             price: product.price, // snapshot current price
//          };
//       });
//       await prisma.orderItem.createMany({ data: orderItemsData });

//       // 3. Return order with its items and products
//       return prisma.order.findUnique({
//          where: { id: order.id },
//          include: {
//             items: {
//                include: { product: true },
//             },
//          },
//       });
//    });

//    return result;
// };
