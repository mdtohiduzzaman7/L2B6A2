import { pool } from "../../config/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../../config";

const signupUser = async (
  name: string,
  email: string,
  password: string,
  phone: string,
  role: string,
) => {
  email = email.toLowerCase();
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (name, email, password, phone, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, phone, role`,
    [name, email, hashedPassword, phone, role],
  );

  return result.rows[0];
};

const checkEmailExists = async (email: string) => {
  const result = await pool.query("SELECT id FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);
  return result.rows.length > 0;
};

const signinUser = async (email: string, password: string) => {
  email = email.toLowerCase();
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  if (result.rows.length === 0) throw new Error("Invalid email or password");

  const user = result.rows[0];
  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) throw new Error("Invalid email or password");

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role.toLowerCase() },
    config.jwtSecret as string,
    { expiresIn: "7d" },
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  };
};

export const AuthService = {
  signupUser,
  checkEmailExists,
  signinUser,
};
