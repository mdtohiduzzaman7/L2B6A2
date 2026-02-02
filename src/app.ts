import express, { Request, Response } from "express";

import "./jobs/autoReturn.job";

import config from "./config";
import { initDB } from "./config/db";
import { VehicleRouters } from "./modules/vehicle/vehicle.router";
import { authRouter } from "./modules/auth/auth.router";
import { usersRouters } from "./modules/users/users.router";

import { bookingsRouter } from "./modules/bookings/bookings.router";

const app = express();


initDB();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use("/api/v1/vehicles", VehicleRouters);
app.use("/api/v1/auth", authRouter);

app.use("/api/v1/users", usersRouters);

app.use("/api/v1/bookings", bookingsRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

export default app;