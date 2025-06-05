import { query } from "../config/db.js";
import dayjs from "dayjs";

export const createTimeSlot = async (req, res) => {
  const { start_time, duration_minutes } = req.body;
  const user_id = req.user.id;

  if (!start_time || !duration_minutes) {
    return res.status(400).json({
      message: "start_time and duration_minutes are required",
    });
  }

  try {
    const providerRes = await query(
      `SELECT id FROM service_providers WHERE user_id = $1`,
      [user_id]
    );
    if (providerRes.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Not authorized or not a provider" });
    }
    const provider_id = providerRes.rows[0].id;

    const start = dayjs(start_time);
    const end = start.add(duration_minutes, "minute");

    const result = await query(
      `INSERT INTO time_slots (provider_id, date, start_time, end_time, is_booked, published)
       VALUES ($1, $2, $3, $4, false, false)
       RETURNING *`,
      [
        provider_id,
        start.format("YYYY-MM-DD"),
        start.format("HH:mm:ss"),
        end.format("HH:mm:ss"),
      ]
    );

    res
      .status(201)
      .json({ message: "Time slot created", slot: result.rows[0] });
  } catch (err) {
    console.error("Error in createTimeSlot:", err);
    res
      .status(500)
      .json({ message: "Failed to create time slot", error: err.message });
  }
};

export const getMyTimeSlots = async (req, res) => {
  const user_id = req.user.id;

  try {
    const providerRes = await query(
      `SELECT id FROM service_providers WHERE user_id = $1`,
      [user_id]
    );
    if (providerRes.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Not authorized or not a provider" });
    }
    const provider_id = providerRes.rows[0].id;

    const result = await query(
      `SELECT *, 
        to_char(date, 'YYYY-MM-DD') || 'T' || start_time AS start_time_iso
       FROM time_slots 
       WHERE provider_id = $1 
       ORDER BY date, start_time`,
      [provider_id]
    );

    res.status(200).json({ slots: result.rows });
  } catch (err) {
    console.error("Error in getMyTimeSlots:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch time slots", error: err.message });
  }
};

export const getAvailableSlots = async (req, res) => {
  const { start_date, end_date, provider_id } = req.query;

  if (!start_date) {
    return res.status(400).json({
      message: "start_date is required",
    });
  }

  try {
    let queryText = `
      SELECT 
        ts.id,
        sp.name AS provider_name,
        s.name AS service_name,
        ts.duration_minutes,
        ts.is_booked,
        ts.published,
        (ts.date || 'T' || ts.start_time)::timestamp AS start_time
      FROM time_slots ts
      JOIN service_providers sp ON ts.provider_id = sp.id
      JOIN services s ON s.provider_id = sp.id
      WHERE ts.date >= $1
        AND ts.is_booked = false
        AND ts.published = true
    `;
    const params = [start_date];

    if (end_date) {
      queryText += ` AND ts.date <= $2`;
      params.push(end_date);
    }

    if (provider_id) {
      queryText += ` AND ts.provider_id = $${params.length + 1}`;
      params.push(provider_id);
    }

    queryText += ` ORDER BY ts.date, ts.start_time`;

    const result = await query(queryText, params);
    res.status(200).json({ available_slots: result.rows });
  } catch (err) {
    console.error("Error in getAvailableSlots:", err);
    res.status(500).json({
      message: "Failed to fetch available slots",
      error: err.message,
    });
  }
};


export const updateTimeSlot = async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;
  const { start_time, duration_minutes } = req.body;

  if (!start_time || !duration_minutes) {
    return res
      .status(400)
      .json({ message: "start_time and duration_minutes are required" });
  }

  try {
    const providerRes = await query(
      `SELECT id FROM service_providers WHERE user_id = $1`,
      [user_id]
    );
    if (providerRes.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Not authorized or not a provider" });
    }
    const provider_id = providerRes.rows[0].id;

    const start = dayjs(start_time);
    const end = start.add(duration_minutes, "minute");

    const result = await query(
      `UPDATE time_slots 
       SET date = $1, start_time = $2, end_time = $3
       WHERE id = $4 AND provider_id = $5
       RETURNING *`,
      [
        start.format("YYYY-MM-DD"),
        start.format("HH:mm:ss"),
        end.format("HH:mm:ss"),
        id,
        provider_id,
      ]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Time slot not found or not yours" });
    }

    res
      .status(200)
      .json({ message: "Time slot updated", slot: result.rows[0] });
  } catch (err) {
    console.error("Error in updateTimeSlot:", err);
    res
      .status(500)
      .json({ message: "Failed to update time slot", error: err.message });
  }
};

export const deleteTimeSlot = async (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;

  try {
    const providerRes = await query(
      `SELECT id FROM service_providers WHERE user_id = $1`,
      [user_id]
    );
    if (providerRes.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Not authorized or not a provider" });
    }
    const provider_id = providerRes.rows[0].id;

    const result = await query(
      `DELETE FROM time_slots 
       WHERE id = $1 AND provider_id = $2
       RETURNING *`,
      [id, provider_id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Time slot not found or not yours" });
    }

    res.status(200).json({ message: "Time slot deleted" });
  } catch (err) {
    console.error("Error in deleteTimeSlot:", err);
    res
      .status(500)
      .json({ message: "Failed to delete time slot", error: err.message });
  }
};

export const publishSlots = async (req, res) => {
  const user_id = req.user.id;

  try {
    const providerRes = await query(
      `SELECT id FROM service_providers WHERE user_id = $1`,
      [user_id]
    );

    if (providerRes.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Not authorized or not a provider" });
    }

    const provider_id = providerRes.rows[0].id;

    await query(
      `UPDATE time_slots SET published = true WHERE provider_id = $1`,
      [provider_id]
    );

    res.status(200).json({ message: "All time slots published" });
  } catch (err) {
    console.error("Error in publishSlots:", err);
    res
      .status(500)
      .json({ message: "Failed to publish slots", error: err.message });
  }
};
