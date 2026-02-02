import { Request, Response } from "express";
import { pool } from "../../config/db";
import { UserService } from "./user.service";

const getAllUsers = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only",
      });
    }
    const result = await UserService.getAllUsers();

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No users found",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
      error: error.message,
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const { name, email, phone, role } = req.body;

    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (req.user.role === "customer" && req.user.id !== Number(userId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const newRole = req.user.role === "admin" ? role : undefined;

    const result = await UserService.updateUser(
      userId as string,
      name,
      email,
      phone,
      newRole,
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};

const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    const bookingCheck = await pool.query(
      "SELECT * FROM bookings WHERE customer_id = $1 AND status = 'active'",
      [userId],
    );

    if (bookingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete user with active bookings",
      });
    }

    const result = await UserService.deleteUser(userId as string);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};
export const UsersController = {
  getAllUsers,
  updateUser,
  deleteUser,
};
