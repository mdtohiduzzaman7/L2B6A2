import express, { Request, Response } from "express";
import { pool } from "../../config/db";
import { VehicleService } from "./vehicle.service";

const createVehicle = async (req: Request, res: Response) => {
  const {
    vehicle_name,
    type,
    registration_number,
    daily_rent_price,
    availability_status,
  } = req.body;
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only",
      });
    }

    const result = await VehicleService.createVehicle(
      vehicle_name,
      type,
      registration_number,
      daily_rent_price,
      availability_status,
    );
    res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create vehicle",
      error: error.message,
    });
  }
};

const getAllVehicles = async (req: Request, res: Response) => {
  try {
  
    const result = await VehicleService.getAllVehicles();

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No vehicles found",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicles retrieved successfully",
      data: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve vehicles",
      error: error.message,
    });
  }
};

const getSingleVehicle = async (req: Request, res: Response) => {
  try {
    const vehicleId = req.params.vehicleId;

    const result = await VehicleService.getSingleVehicle(vehicleId as string);
    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No vehicles found",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicles retrieved successfully",
      data: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve vehicles",
      error: error.message,
    });
  }
};

const updateVehicle = async (req: Request, res: Response) => {
  try {
    const vehicleId = req.params.vehicleId;
    const {
      vehicle_name,
      type,
      registration_number,
      daily_rent_price,
      availability_status,
    } = req.body;

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only",
      });
    }
    const vehicleCheck = await pool.query(
      "SELECT * FROM vehicles WHERE id = $1",
      [vehicleId],
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    if (availability_status === "unavailable") {
      const bookingCheck = await pool.query(
        "SELECT * FROM bookings WHERE vehicle_id = $1 AND status = 'active'",
        [vehicleId],
      );

      if (bookingCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot mark vehicle unavailable with active bookings",
        });
      }
    }

    const result = await pool.query(
      `UPDATE vehicles
       SET 
         vehicle_name = COALESCE($1, vehicle_name),
         type = COALESCE($2, type),
         registration_number = COALESCE($3, registration_number),
         daily_rent_price = COALESCE($4, daily_rent_price),
         availability_status = COALESCE($5, availability_status)
       WHERE id = $6
       RETURNING *`,
      [
        vehicle_name,
        type,
        registration_number,
        daily_rent_price,
        availability_status,
        vehicleId,
      ],
    );

    res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update vehicle",
      error: error.message,
    });
  }
};

const deleteVehicle = async (req: Request, res: Response) => {
  try {

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only",
      });
    }
    const vehicleId = req.params.vehicleId;

    const bookingCheck = await pool.query(
      "SELECT * FROM bookings WHERE vehicle_id = $1 AND status = 'active'",
      [vehicleId],
    );

    if (bookingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete vehicle with active bookings",
      });
    }

    const result = await VehicleService.deleteVehicle(vehicleId as string);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete vehicle",
      error: error.message,
    });
  }
};

export const VehicleController = {
  createVehicle,
  getAllVehicles,
  getSingleVehicle,
  updateVehicle,
  deleteVehicle,
};
