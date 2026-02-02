import { pool } from "../../config/db";

interface BookingInput {
  customer_id: number;
  vehicle_id: number;
  rent_start_date: string;
  rent_end_date: string;
}

const createBooking = async (input: BookingInput) => {
  const client = await pool.connect();
  try {
    const { customer_id, vehicle_id, rent_start_date, rent_end_date } = input;

    // কাস্টমার আছে কিনা চেক
    const userCheck = await client.query("SELECT id FROM users WHERE id = $1", [
      customer_id,
    ]);
    if (userCheck.rows.length === 0) throw new Error("Customer not found");

    // ভেহিকল চেক
    const vehicleResult = await client.query(
      "SELECT vehicle_name, daily_rent_price, availability_status FROM vehicles WHERE id = $1",
      [vehicle_id],
    );
    if (vehicleResult.rows.length === 0) throw new Error("Vehicle not found");

    const vehicle = vehicleResult.rows[0];
    if (vehicle.availability_status !== "available")
      throw new Error("Vehicle is not available for booking");

    // তারিখ যাচাই
    const startDate = new Date(rent_start_date);
    const endDate = new Date(rent_end_date);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
      throw new Error("Invalid date format");
    if (endDate < startDate)
      throw new Error("End date must be after start date");

    // মোট দাম হিসাব
    const days =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
    const total_price = days * parseFloat(vehicle.daily_rent_price);

    // ট্রানজেকশন শুরু
    await client.query("BEGIN");

    const bookingResult = await client.query(
      `INSERT INTO bookings
        (customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING *`,
      [customer_id, vehicle_id, rent_start_date, rent_end_date, total_price],
    );

    await client.query(
      "UPDATE vehicles SET availability_status = 'booked' WHERE id = $1",
      [vehicle_id],
    );

    await client.query("COMMIT");

    return { booking: bookingResult.rows[0], vehicle };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getAllBookings = async (userId: number, role: string) => {
  let query = "";
  let params: any[] = [];

  if (role === "admin") {
    query = `
      SELECT 
        b.*,
        u.name AS customer_name,
        u.email AS customer_email,
        v.vehicle_name,
        v.registration_number
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN vehicles v ON b.vehicle_id = v.id
      ORDER BY b.id DESC
    `;
  } else {
    query = `
      SELECT 
        b.id,
        b.vehicle_id,
        b.rent_start_date,
        b.rent_end_date,
        b.total_price,
        b.status,
        v.vehicle_name,
        v.registration_number,
        v.type
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.customer_id = $1
      ORDER BY b.id DESC
    `;
    params = [userId];
  }

  const result = await pool.query(query, params);
  return result.rows;
};

interface UpdateBookingInput {
  bookingId: number;
  status: "cancelled" | "returned";
  userId: number;
  role: string;
}

const updateBooking = async (input: UpdateBookingInput) => {
  const { bookingId, status, userId, role } = input;
  const client = await pool.connect();

  try {
    if (!["cancelled", "returned"].includes(status)) {
      throw new Error("Invalid status value");
    }

    // Booking exists check
    const bookingResult = await client.query(
      "SELECT * FROM bookings WHERE id = $1",
      [bookingId],
    );

    if (bookingResult.rows.length === 0) {
      throw new Error("Booking not found");
    }

    const booking = bookingResult.rows[0];

    // 👤 Customer rules
    if (role === "customer") {
      if (booking.customer_id !== userId) {
        throw new Error("You can update only your own bookings");
      }
      if (status !== "cancelled") {
        throw new Error("Customer can only cancel booking");
      }

      const updated = await client.query(
        "UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING *",
        [bookingId],
      );

      return { booking: updated.rows[0] };
    }

    // 👑 Admin rules
    if (role === "admin") {
      if (status !== "returned") {
        throw new Error("Admin can only mark booking as returned");
      }

      await client.query("BEGIN");

      const updated = await client.query(
        "UPDATE bookings SET status = 'returned' WHERE id = $1 RETURNING *",
        [bookingId],
      );

      await client.query(
        "UPDATE vehicles SET availability_status = 'available' WHERE id = $1",
        [booking.vehicle_id],
      );

      await client.query("COMMIT");

      return {
        booking: {
          ...updated.rows[0],
          vehicle: { availability_status: "available" },
        },
      };
    }

    throw new Error("Unauthorized operation");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};



export const bookingsService = {
  createBooking,
  getAllBookings,
  updateBooking,
};
