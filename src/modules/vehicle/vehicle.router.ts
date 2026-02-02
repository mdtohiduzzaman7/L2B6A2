import { Router } from "express";

import { VehicleController } from "./vehicle.controller";
import auth from "../../middleware/auth";

const router = Router();

router.post("/", auth("Admin"), VehicleController.createVehicle);
router.get("/", VehicleController.getAllVehicles);
router.get("/:vehicleId", VehicleController.getSingleVehicle);
router.put("/:vehicleId", auth("Admin"), VehicleController.updateVehicle);
router.delete("/:vehicleId", auth("Admin"), VehicleController.deleteVehicle);

export const VehicleRouters = router;
