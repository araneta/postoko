import express from 'express';
import usersController from '../controllers/Users.js';
import { requireAuth } from '@clerk/express';
const router = express.Router();


router.post('/login',requireAuth(), usersController.login);
router.get('/jwt-token',requireAuth(), usersController.getJwtToken);

export default router;