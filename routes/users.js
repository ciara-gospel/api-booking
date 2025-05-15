import express from 'express';
import {authenticate} from '../middlewares/authmiddleware.js';

const router = express.Router();
router.get('/dashboard', authenticate, (req, res) => {
  res.json({message: `Hello ${req.user.role} ${req.user.id}` });
})
export default router;