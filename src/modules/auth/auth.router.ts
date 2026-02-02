import { Router } from "express";
import { AuthController } from "./auth.controller";


export const authRouter = Router();

authRouter.post("/signup", AuthController.signupAuth);
authRouter.post("/signin", AuthController.signinAuth);
