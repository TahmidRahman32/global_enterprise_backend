import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { productService } from "./product.service";
import sendResponse from "../../shared/sendResponse";
// import pick from "../../helper/pick";
import httpStatus from "http-status";
import pick from "../../helpers/pick";

const createProduct = catchAsync(async (req: Request, res: Response) => {
   // console.log("data", req);
   const result = await productService.createProduct(req);
   // console.log(result);
   sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Product created successfully",
      data: result,
   });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
   // console.log("data", req.body);
   const filters = pick(req.query, ["brand", "category", "name", "searchTerm"]);
   const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
   const result = await productService.getAllProducts(filters, options);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Get AllProducts successfully!",
      data: result,
   });
});

const getProductById = catchAsync(async (req: Request, res: Response) => {
   const { id } = req.params;
   const result = await productService.getProductById(id as string);
   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Product retrieved successfully",
      data: result,
   });
});

const deleteFromDB = catchAsync(async (req: Request, res: Response) => {
   const { id } = req.params;
   const result = await productService.deleteFromDB(id as string);
   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Product deleted successfully",
      data: result,
   });
});

export const ProductController = {
   createProduct,
   getAllProducts,
   deleteFromDB,
   getProductById,
};
