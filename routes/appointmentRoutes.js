import express from 'express';
import { authenticate } from '../middlewares/authmiddleware.js';
import { bookAppointment, getMyAppointments, getProviderAppointments, cancelAppointment } from '../controllers/appointmentController.js';

const router = express.Router();

router.post('/book', authenticate, bookAppointment);
router.get('/my', authenticate, getMyAppointments);
router.get('/provider', authenticate, getProviderAppointments);
router.delete('/:appointment_id', authenticate, cancelAppointment);

export default router;
