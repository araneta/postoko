import express from 'express';
import * as userController from '../controllers/user';
const router = express.Router();
router.post('/signup', userController.createUser);
router.post('/login', userController.userLogin);
export default router;
