import { query } from '../config/db.js';
import dayjs from 'dayjs';

// Créer un créneau horaire
export const createTimeSlot = async (req, res) => {
  const { start_time, duration_minutes } = req.body;
  const provider_id = req.user.id;

  if (!start_time || !duration_minutes) {
    return res.status(400).json({ message: 'start_time and duration_minutes are required' });
  }

  try {
    const start = dayjs(start_time);
    const end = start.add(duration_minutes, 'minute');

    const result = await query(
      `INSERT INTO time_slots (provider_id, date, start_time, end_time, is_booked)
       VALUES ($1, $2, $3, $4, false)
       RETURNING *`,
      [
        provider_id,
        start.format('YYYY-MM-DD'),
        start.format('HH:mm:ss'),
        end.format('HH:mm:ss')
      ]
    );

    res.status(201).json({ message: 'Time slot created', slot: result.rows[0] });
  } catch (err) {
    console.error('Error in createTimeSlot:', err);
    res.status(500).json({ message: 'Failed to create time slot', error: err.message });
  }
};

// Voir tous les créneaux du provider connecté
export const getMyTimeSlots = async (req, res) => {
  const provider_id = req.user.id;

  try {
    const result = await query(
      `SELECT * FROM time_slots WHERE provider_id = $1 ORDER BY date, start_time`,
      [provider_id]
    );
    res.status(200).json({ slots: result.rows });
  } catch (err) {
    console.error('Error in getMyTimeSlots:', err);
    res.status(500).json({ message: 'Failed to fetch time slots', error: err.message });
  }
};

// Voir les créneaux disponibles d'un provider (par date ou intervalle)
export const getAvailableSlots = async (req, res) => {
  const { provider_id, start_date, end_date } = req.query;

  if (!provider_id || !start_date) {
    return res.status(400).json({ message: 'provider_id and start_date are required' });
  }

  try {
    let queryText = `
      SELECT * FROM time_slots
      WHERE provider_id = $1
      AND date >= $2
      AND is_booked = false
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
    console.error('Error in getAvailableSlots:', err);
    res.status(500).json({ message: 'Failed to fetch available slots', error: err.message });
  }
};

export const updateTimeSlot = async (req, res) => {
  const provider_id = req.user.id;
  const { id } = req.params;
  const { start_time, duration_minutes } = req.body;

  if (!start_time || !duration_minutes) {
    return res.status(400).json({ message: 'start_time and duration_minutes are required' });
  }

  try {
    const start = dayjs(start_time);
    const end = start.add(duration_minutes, 'minute');

    const result = await query(
      `UPDATE time_slots 
       SET date = $1, start_time = $2, end_time = $3
       WHERE id = $4 AND provider_id = $5
       RETURNING *`,
      [
        start.format('YYYY-MM-DD'),
        start.format('HH:mm:ss'),
        end.format('HH:mm:ss'),
        id,
        provider_id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Time slot not found or not yours' });
    }

    res.status(200).json({ message: 'Time slot updated', slot: result.rows[0] });
  } catch (err) {
    console.error('Error in updateTimeSlot:', err);
    res.status(500).json({ message: 'Failed to update time slot', error: err.message });
  }
};

export const deleteTimeSlot = async (req, res) => {
  const provider_id = req.user.id;
  const { id } = req.params;

  try {
    const result = await query(
      `DELETE FROM time_slots 
       WHERE id = $1 AND provider_id = $2
       RETURNING *`,
      [id, provider_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Time slot not found or not yours' });
    }

    res.status(200).json({ message: 'Time slot deleted' });
  } catch (err) {
    console.error('Error in deleteTimeSlot:', err);
    res.status(500).json({ message: 'Failed to delete time slot', error: err.message });
  }
};
