import { pool } from "../../config/db";

const getAllUsers = async () => {
  const result = await pool.query(
    "SELECT id, name, email, phone, role FROM users",
  );
  return result;
};

export const updateUser = async (
  userId: string,
  name?: string,
  email?: string,
  phone?: string,
  role?: string,
) => {
  const result = await pool.query(
    `UPDATE users
       SET 
         name = COALESCE($1, name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         role = COALESCE($4, role)
       WHERE id = $5
       RETURNING *`,
    [name, email, phone, role, userId],
  );
  return result;
};


const deleteUser = async (userId: string) => {
  const result = await pool.query(
    "DELETE FROM users WHERE id = $1 RETURNING *",
    [userId],
  );
  return result;
}
export const UserService = {
  getAllUsers,
  updateUser,
  deleteUser,
};
