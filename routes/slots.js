import express from 'express';
import { createTimeSlot, getMyTimeSlots, getAvailableSlots, updateTimeSlot, deleteTimeSlot } from '../controllers/timeSlotController.js';
import { authenticate } from '../middlewares/authmiddleware.js';



/**
 * @swagger
 * /api/slots:
 *   post:
 *     summary: Create timeslot
 *     tags: [TimeSlot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - start_time
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-06-25"
 *               start_time:
 *                 type: string
 *                 format: time
 *                 example: "14:00:00"
 *     responses:
 *       201:
 *         description: timeslot created successfully
 *       400:
 *         description: invalides data
 *       401:
 *         description: Not authorise
 *       500:
 *         description: Error server
 */



const router = express.Router();

// Provider crée un créneau
router.post('/slots', authenticate, createTimeSlot);

// Provider voit ses créneaux
router.get('/slots/mine', authenticate, getMyTimeSlots);

// Client voit les créneaux d’un provider
router.get('/slots/available', authenticate, getAvailableSlots);
router.put('/slots/:id', authenticate, updateTimeSlot);
router.delete("/slots/:id", authenticate, deleteTimeSlot);

export default router;
