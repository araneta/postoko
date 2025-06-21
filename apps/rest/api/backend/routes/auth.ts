import express from 'express';
import usersController from '../controllers/Users';
const router = express.Router();


router.post('/login', usersController.login);
router.get('/jwt-token', usersController.getJwtToken);

export default router;