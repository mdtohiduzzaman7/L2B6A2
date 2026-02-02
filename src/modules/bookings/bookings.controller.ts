import { Request, Response } from "express";
import { bookingsService } from "./bookings.service";
import { pool } from "../../config/db";

// POST Booking
const createBooking = async (req: any, res: Response) => {
  try {
    const { customer_id, vehicle_id, rent_start_date, rent_end_date } =
      req.body;

    // কাস্টমার শুধু নিজের জন্য বুক করতে পারবে
    if (req.user.role === "customer" && req.user.id !== customer_id) {
      return res.status(403).json({
        success: false,
        message: "You can only create booking for your own account",
      });
    }

    const { booking, vehicle } = await bookingsService.createBooking({
      customer_id,
      vehicle_id,
      rent_start_date,
      rent_end_date,
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: {
        ...booking,
        vehicle: {
          vehicle_name: vehicle.vehicle_name,
          daily_rent_price: vehicle.daily_rent_price,
        },
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create booking",
    });
  }
};

// GET All Bookings
const getAllBookings = async (req: any, res: Response) => {
  try {
    const { id: userId, role } = req.user;

    const rows = await bookingsService.getAllBookings(userId, role);

    const data =
      role === "admin"
        ? rows.map((row: any) => ({
            id: row.id,
            customer_id: row.customer_id,
            vehicle_id: row.vehicle_id,
            rent_start_date: row.rent_start_date,
            rent_end_date: row.rent_end_date,
            total_price: row.total_price,
            status: row.status,
            customer: {
              name: row.customer_name,
              email: row.customer_email,
            },
            vehicle: {
              vehicle_name: row.vehicle_name,
              registration_number: row.registration_number,
            },
          }))
        : rows.map((row: any) => ({
            id: row.id,
            vehicle_id: row.vehicle_id,
            rent_start_date: row.rent_start_date,
            rent_end_date: row.rent_end_date,
            total_price: row.total_price,
            status: row.status,
            vehicle: {
              vehicle_name: row.vehicle_name,
              registration_number: row.registration_number,
              type: row.type,
            },
          }));

    res.status(200).json({
      success: true,
      message:
        role === "admin"
          ? "Bookings retrieved successfully"
          : "Your bookings retrieved successfully",
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve bookings",
      error: error.message,
    });
  }
};


// put Bookings

const updateBooking = async (req: any, res: Response) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    if (isNaN(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bookingId",
      });
    }

    const { status } = req.body;
    const { id: userId, role } = req.user;

    const { booking } = await bookingsService.updateBooking({
      bookingId,
      status,
      userId,
      role,
    });

    const message =
      role === "customer"
        ? "Booking cancelled successfully"
        : "Booking marked as returned. Vehicle is now available";

    res.status(200).json({
      success: true,
      message,
      data: booking,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update booking",
    });
  }
};

export const bookingsController = {
  createBooking,
  getAllBookings,
  updateBooking
};
