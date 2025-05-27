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

    res.status(201).json({ message: "Time slot created", slot: result.rows[0] });
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
      `SELECT * FROM time_slots WHERE provider_id = $1 ORDER BY date, start_time`,
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
  const { provider_id, start_date, end_date } = req.query;

  if (!provider_id || !start_date) {
    return res
      .status(400)
      .json({ message: "provider_id and start_date are required" });
  }

  try {
    let queryText = `
      SELECT * FROM time_slots
      WHERE provider_id = $1
      AND date >= $2
      AND is_booked = false
      AND published = true
    `;
    const params = [provider_id, start_date];

    if (end_date) {
      queryText += ` AND date <= $3`;
      params.push(end_date);
    }

    queryText += ` ORDER BY date, start_time`;

    const result = await query(queryText, params);
    res.status(200).json({ available_slots: result.rows });
  } catch (err) {
    console.error("Error in getAvailableSlots:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch available slots", error: err.message });
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

    res.status(200).json({ message: "Time slot updated", slot: result.rows[0] });
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
