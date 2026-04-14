import express, { NextFunction, Request, Response } from "express";

// import { userRole } from "@prisma/client";

import auth from "../../middlewares/auth";
import { file } from "zod";
// import { fileUploader } from "../../helper/fileUploader";
// import { userValidation } from "../user/user.validation";
import { MassageController } from "./massage.controller";
import { userRole } from "../../../generated/enums";

// import { UserRole } from "@prisma/client";

const router = express.Router();

router.get("/all", MassageController.getAllMassages);
router.get("/:id", MassageController.getMassageById);

router.post("/create", auth(userRole.USER, userRole.ADMIN), MassageController.createMassage);
export const MassageRoutes = router;
