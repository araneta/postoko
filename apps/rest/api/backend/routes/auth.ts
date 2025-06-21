import express from 'express';
import usersController from '../controllers/Users';
const router = express.Router();


router.post('/login', usersController.login);

export default router;