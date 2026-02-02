import { Request, Response } from "express";
import { AuthService } from "./auth.service";

const signupAuth = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (!["admin", "customer"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const emailExists = await AuthService.checkEmailExists(email);
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const user = await AuthService.signupUser(
      name,
      email,
      password,
      phone,
      role as "admin" | "customer",
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to register user",
      error: error.message,
    });
  }
};

const signinAuth = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const data = await AuthService.signinUser(email, password);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const AuthController = {
  signupAuth,
  signinAuth,
};
