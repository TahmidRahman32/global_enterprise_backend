import express, { NextFunction, Request, Response } from "express";

import auth from "../../middlewares/auth";
// import { userRole } from "@prisma/client";
import { ProductController } from "./product.controller";
import { file } from "zod";
// import { fileUploader } from "../../helper/fileUploader";
// import { userValidation } from "../user/user.validation";
import { productValidation } from "./product.validation";
import { userRole } from "../../../generated/enums";
import { fileUploader } from "../../helpers/fileUploader";
// import { UserRole } from "@prisma/client";

const router = express.Router();
router.get("/all", ProductController.getAllProducts);
router.get("/:id", ProductController.getProductById);

router.post("/create", auth(userRole.ADMIN, userRole.USER), fileUploader.upload.single("file"), (req: Request, res: Response, next: NextFunction) => {
   req.body = productValidation.productValidationSchema.parse(JSON.parse(req.body.data));

   return ProductController.createProduct(req, res, next);
});

router.delete("/:id", ProductController.deleteFromDB);
export const ProductRoutes = router;
