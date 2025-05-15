import express from 'express';
import { createTimeSlot, getMyTimeSlots, getAvailableSlots, updateTimeSlot, deleteTimeSlot } from '../controllers/timeSlotController.js';
import { authenticate } from '../middlewares/authmiddleware.js';

const router = express.Router();

// Provider crée un créneau
router.post('/slots', authenticate, createTimeSlot);

// Provider voit ses créneaux
router.get('/slots/mine', authenticate, getMyTimeSlots);

// Client voit les créneaux d’un provider
router.get('/slots/available', authenticate, getAvailableSlots);
router.put('/slots/:id', authenticate, updateTimeSlot);
router.delete("/slots/;id", authenticate, deleteTimeSlot);

export default router;
