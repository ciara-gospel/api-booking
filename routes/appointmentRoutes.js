import express from 'express';
import { authenticate } from '../middlewares/authmiddleware.js';
import { bookAppointment, getMyAppointments, getProviderAppointments, cancelAppointment } from '../controllers/appointmentController.js';



/**
 * @swagger
 * /appointment/book:
 *   post:
 *     summary: make booking
 *     tags: [Appointment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - time_slot_id
 *             properties:
 *               time_slot_id:
 *                 type: string
 *                 format: uuid
 *                 description: L'UUID du créneau à réserver
 *               notes:
 *                 type: string
 *                 description: (Optionnel) Remarques pour le rendez-vous
 *     responses:
 *       201:
 *         description: Rendez-vous réservé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 appointment:
 *                   type: object
 *                   example:
 *                     id: "e7e0cb4e-f1cf-4d40-9d8a-0d76ffaeff87"
 *                     user_id: "c4ce7886-7ddf-4e2a-b7a2-d102a72eb32e"
 *                     provider_id: "cae3fdd6-f096-4a54-bf3a-d05153e60868"
 *                     time_slot_id: "1a2b3c4d-5678-90ab-cdef-1234567890ab"
 *                     notes: "Merci d’être à l’heure."
 *       400:
 *         description: invalid request
 *       401:
 *         description: Not authorize or token not found
 *       500:
 *         description: internal server error
 */

/**
 * @swagger
 * /api/appointment/my:
 *   get:
 *     summary: get user appointments
 *     tags: [Appointment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: list of appointments
 *       401:
 *         description: not authorize
 *       500:
 *         description: Error server
 */

/**
 * @swagger
 * /api/appointment/provider:
 *   get:
 *     summary: get provider appointments
 *     tags: [Appointment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of appointment
 *       401:
 *         description: Not authorize
 *       500:
 *         description: Error server
 */


/**
 * @swagger
 * /api/appointment/{id}:
 *   delete:
 *     summary: cancel appointment
 *     tags: [Appointment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: L'ID of de appointment to cancel
 *     responses:
 *       200:
 *         description: appointment
 *       404:
 *         description: appointment not found
 *       401:
 *         description: Not authorize
 *       500:
 *         description: Error server
 */



const router = express.Router();

router.post('/book', authenticate, bookAppointment);
router.get('/my', authenticate, getMyAppointments);
router.get('/provider', authenticate, getProviderAppointments);
router.delete('/:appointment_id', authenticate, cancelAppointment);

export default router;
