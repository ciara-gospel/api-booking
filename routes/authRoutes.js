import express from 'express';
import { registerUser, registerProvider, login } from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../middlewares/authmiddleware.js';

const router = express.Router();

router.post('/register/user', validateRegister, registerUser);
router.post('/register/provider', validateRegister, registerProvider);
router.post('/login', validateLogin, login);

export default router;