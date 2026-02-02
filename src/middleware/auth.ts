import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../config/db";

const auth = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {

      console.log(roles);

      const roless = roles.map((role) => role.toLowerCase());
      
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Token missing",
        });
      }

      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(
        token as string,
        config.jwtSecret as string,
      ) as JwtPayload;

      // req.user = {
      //   id: decoded.id,
      //   email: decoded.email,
      //   role: decoded.role,
      // };

      if (roless.length && !roless.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Access denied",
        });
      }

      const user = await pool.query(`SELECT id FROM users WHERE email = $1`, [
        decoded.email,
      ]);

      if (user.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: User not found",
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or expired token",
      });
    }
  };
};
export default auth;
