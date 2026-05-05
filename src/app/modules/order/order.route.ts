import { Router } from "express";
import auth from "../../middlewares/auth";
import { orderController } from "./order.controller";
import { userRole } from "../../../generated/enums";

const router = Router();

router.get("/all", orderController.getAllOrders);
// router.get("/:id", MassageController.getMassageById);
router.patch("/:id", auth(userRole.ADMIN), orderController.updateOrderStatus);
router.patch("/from/:id", auth(userRole.USER), orderController.UpdateOrderFrom);

router.delete("/:id", orderController.DeleteOrder);

router.post("/create", auth(userRole.USER), orderController.OrderCreate);
export const orderRoutes = router;
