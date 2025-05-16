import { query } from "../config/db.js";
import dayjs from "dayjs";

// Créer un rendez-vous
export const bookAppointment = async (req, res) => {
  const { time_slot_id, notes } = req.body;
  const user_id = req.user.id;

  if (!time_slot_id) {
    return res.status(400).json({ message: "time_slot_id is required" });
  }

  try {
    // 1. Vérifie que le créneau existe et est disponible
    const slotRes = await query(
      `SELECT * FROM time_slots WHERE id = $1 AND is_booked = false`,
      [time_slot_id]
    );

    if (slotRes.rows.length === 0) {
      return res.status(400).json({ message: "Time slot not available" });
    }

    const slot = slotRes.rows[0];

    // Debug logs
    console.log("slot.date:", slot.date); // e.g. 2025-06-22
    console.log("slot.start_time:", slot.start_time); // e.g. 14:30:00

    const date = dayjs(slot.date); // contient déjà l'heure = 23:00:00
    const [hours, minutes, seconds] = slot.start_time.split(":");
    const appointment_time = date
      .hour(parseInt(hours))
      .minute(parseInt(minutes))
      .second(parseInt(seconds))
      .toISOString();

    // 2. Création du rendez-vous
    const appointmentRes = await query(
      `INSERT INTO appointments (user_id, provider_id, appointment_time, notes, time_slot_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, slot.provider_id, appointment_time, notes || "", time_slot_id]
    );

    // 3. Marque le créneau comme réservé
    await query(`UPDATE time_slots SET is_booked = true WHERE id = $1`, [
      time_slot_id,
    ]);

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment: appointmentRes.rows[0],
    });
  } catch (err) {
    console.error("Booking error:", err); // log technique
    res.status(500).json({
      message: "Failed to book appointment",
      error: err.message,
    });
  }
};

// Voir mes rendez-vous (CLIENT)
export const getMyAppointments = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await query(
      `SELECT a.*, u.first_name AS provider_name
       FROM appointments a
       JOIN service_providers sp ON sp.id = a.provider_id
       JOIN users u ON u.id = sp.user_id
       WHERE a.user_id = $1
       ORDER BY a.appointment_time DESC`,
      [user_id]
    );

    res.status(200).json({ appointments: result.rows });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch appointments",
      error: err.message,
    });
  }
};

// Voir les rendez-vous d’un prestataire (PROVIDER)
export const getProviderAppointments = async (req, res) => {
  const provider_id = req.user.id;

  try {
    const result = await query(
      `SELECT a.*, u.first_name AS client_name, u.email
       FROM appointments a
       JOIN users u ON u.id = a.user_id
       WHERE a.provider_id = $1
       ORDER BY a.appointment_time DESC`,
      [provider_id]
    );

    res.status(200).json({ appointments: result.rows });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch provider appointments",
      error: err.message,
    });
  }
};

// Annuler un rendez-vous (Client ou Provider)
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
      return res.status(403).json({
        message: "Unauthorized to cancel this appointment",
      });
    }

    await query(
      `UPDATE appointments SET status = 'canceled', updated_at = NOW() WHERE id = $1`,
      [appointment_id]
    );

    await query(`UPDATE time_slots SET is_booked = false WHERE id = $1`, [
      appointment.time_slot_id,
    ]);

    res.status(200).json({ message: "Appointment canceled successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to cancel appointment",
      error: err.message,
    });
  }
};
