import { Router } from "express";
import { UsersController } from "./users.controller";
import auth from "../../middleware/auth";

const router = Router();

router.get("/", auth("Admin"), UsersController.getAllUsers);

router.put("/:userId", auth("Admin"), UsersController.updateUser);
router.delete("/:userId", auth("Admin"), UsersController.deleteUser);
export const usersRouters = router;
