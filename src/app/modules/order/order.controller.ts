import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { IJWTPayload } from "../../shared/Types/commonTypes";
import { orderService } from "./order.service";
import sendResponse from "../../shared/sendResponse";
import pick from "../../helpers/pick";
import { orderSearchAbleFields } from "../massage/massage.constant";

import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";

const OrderCreate = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
   // console.log("data", req.body, "user", req.user);

   const result = await orderService.OrderCreate(req.user!, req.body);
   // console.log(result);
   sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Order created successfully",
      data: result,
   });
});

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
   const filters = pick(req.query, orderSearchAbleFields);
   const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

   const result = await orderService.getAllOrders(filters, options);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Get all Order data fetched!",
      meta: result.meta,
      data: result.data,
   });
});
const getMyOrders = catchAsync(async (req: Request & { user?: IAuthUser }, res: Response) => {
   const user = req.user;
   const filters = pick(req.query, ["status", "searchTerm"]);
   const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

   const result = await orderService.getMyOrders(user as IAuthUser, filters, options);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My order fetched successfully!!",
      data: result.data,
      meta: result.meta,
   });
});

// order.controller.ts
const updateOrderStatus = async (req: Request, res: Response) => {
   const { id } = req.params;
   const { status } = req.body;

   const result = await orderService.UpdateOrderStatus(id as string, { status });

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Order status updated successfully",
      data: result,
   });
};
const UpdateOrderFrom = async (req: Request, res: Response) => {
   const { id } = req.params;
   const payload = req.body;

   const result = await orderService.UpdateOrderFrom(id as string, payload);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Order from updated successfully",
      data: result,
   });
};

const DeleteOrder = catchAsync(async (req: Request, res: Response) => {
   const { id } = req.params;
   const result = await orderService.DeleteOrder(id as string);
   sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Delete order successfully",
      data: result,
   });
});

export const orderController = {
   OrderCreate,
   DeleteOrder,
   getAllOrders,
   updateOrderStatus,
   UpdateOrderFrom,
   getMyOrders,
};
