import { query } from "../config/db.js";
import dayjs from "dayjs";

export const bookAppointment = async (req, res) => {
  const { time_slot_id, notes } = req.body;
  const user_id = req.user.id;

  if (!time_slot_id) {
    return res.status(400).json({ message: "time_slot_id is required" });
  }

  try {
    const slotRes = await query(
      `SELECT * FROM time_slots WHERE id = $1 AND is_booked = false`,
      [time_slot_id]
    );

    if (slotRes.rows.length === 0) {
      return res.status(400).json({ message: "Time slot not available" });
    }

    const slot = slotRes.rows[0];
    const date = dayjs(slot.date);
    const [hours, minutes, seconds] = slot.start_time.split(":");

    const appointment_time = date
      .hour(parseInt(hours))
      .minute(parseInt(minutes))
      .second(parseInt(seconds))
      .toISOString();

    const appointmentRes = await query(
      `INSERT INTO appointments (user_id, provider_id, appointment_time, notes, time_slot_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, slot.provider_id, appointment_time, notes || "", time_slot_id]
    );

    await query(`UPDATE time_slots SET is_booked = true WHERE id = $1`, [
      time_slot_id,
    ]);

    // Émission de l'événement WebSocket
    req.io.emit("appointment:booked", {
      providerId: slot.provider_id,
      appointment: appointmentRes.rows[0],
    });

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: appointmentRes.rows[0],
    });
  } catch (err) {
    console.error("Error in bookAppointment:", err);
    res.status(500).json({
      message: "Failed to book appointment",
      error: err.message,
    });
  }
};


export const getMyAppointments = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await query(
      `SELECT * FROM appointments WHERE user_id = $1 ORDER BY appointment_time DESC`,
      [user_id]
    );

    res.status(200).json({ appointments: result.rows });
  } catch (err) {
    console.error("Error in getMyAppointments:", err);
    res.status(500).json({ message: "Error fetching appointments", error: err.message });
  }
};

export const getProviderAppointments = async (req, res) => {
  const provider_id = req.user.id;

  try {
    const result = await query(
      `SELECT * FROM appointments WHERE provider_id = $1 ORDER BY appointment_time DESC`,
      [provider_id]
    );

    res.status(200).json({ appointments: result.rows });
  } catch (err) {
    console.error("Error in getProviderAppointments:", err);
    res.status(500).json({ message: "Error fetching appointments", error: err.message });
  }
};

export const cancelAppointment = async (req, res) => {
  const user_id = req.user.id;
  const { appointment_id } = req.params;

  try {
    const result = await query(`SELECT * FROM appointments WHERE id = $1`, [
      appointment_id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const appointment = result.rows[0];

    if (
      appointment.user_id !== user_id &&
      appointment.provider_id !== user_id
    ) {
      return res.status(403).json({ message: "Unauthorized to cancel this appointment" });
    }

    await query(
      `UPDATE appointments SET status = 'canceled', updated_at = NOW() WHERE id = $1`,
      [appointment_id]
    );

    await query(`UPDATE time_slots SET is_booked = false WHERE id = $1`, [
      appointment.time_slot_id,
    ]);

    // Émission de l'événement WebSocket
    req.io.emit("appointment:canceled", {
      providerId: appointment.provider_id,
      clientId: appointment.user_id,
      appointmentId: appointment.id,
    });

    res.status(200).json({ message: "Appointment canceled successfully" });
  } catch (err) {
    console.error("Error in cancelAppointment:", err);
    res.status(500).json({ message: "Failed to cancel appointment", error: err.message });
  }
};
