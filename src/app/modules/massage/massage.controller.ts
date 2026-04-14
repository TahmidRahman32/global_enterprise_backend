import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { massageService } from "./massage.service";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { IJWTPayload } from "../../shared/Types/commonTypes";
import pick from "../../helpers/pick";
import { massageFilterableFields } from "./massage.constant";
// import { userFilterableFields } from "./massage.constant";

const createMassage = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
   console.log("data", req.body, "user", req.user);

   const result = await massageService.massageCreate(req.user!, req.body);
   console.log(result);
   sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Massage created successfully",
      data: result,
   });
});

const getAllMassages = catchAsync(async (req: Request, res: Response) => {
   const filters = pick(req.query, massageFilterableFields);
   const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

   const result = await massageService.getAllMassages(filters, options);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Get all Massages data fetched!",
      meta: result.meta,
      data: result.data,
   });
});

const getMassageById = catchAsync(async (req: Request, res: Response) => {
   const { id } = req.params;
   const result = await massageService.getMassageById(id as string);
   sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Massage retrieved successfully",
      data: result,
   });
});

export const MassageController = {
   createMassage,
   getAllMassages,
   getMassageById,
};
