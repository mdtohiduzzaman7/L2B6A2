import cron from "node-cron";
import { pool } from "../config/db";

const autoReturnBookings = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const bookingsResult = await pool.query(
      `SELECT * FROM bookings
       WHERE status = 'active'
       AND rent_end_date < $1`,
      [today],
    );

    for (const booking of bookingsResult.rows) {
      await pool.query(
        "UPDATE bookings SET status = 'returned' WHERE id = $1",
        [booking.id],
      );

      await pool.query(
        "UPDATE vehicles SET availability_status = 'available' WHERE id = $1",
        [booking.vehicle_id],
      );
    }

    return {
      success: true,
      message: "No expired bookings found",
      data: {
        total_auto_returned: bookingsResult.rows.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Auto-return job failed",
      data: error instanceof Error ? error.message : error,
    };
  }
};

cron.schedule("1 0 * * *", autoReturnBookings);

export default autoReturnBookings;
