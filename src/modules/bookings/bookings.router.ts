import { Router } from "express";
import auth from "../../middleware/auth";
import { bookingsController } from "./bookings.controller";

const router = Router();

router.post("/", auth("Admin"), bookingsController.createBooking);

router.get("/", auth("Admin"), bookingsController.getAllBookings);

router.put("/:bookingId", auth("Admin"), bookingsController.updateBooking);
export const bookingsRouter = router;
