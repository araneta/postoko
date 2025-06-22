import express from 'express';
import ordersController from '../controllers/Orders';
import { requireAuth } from '@clerk/express';
const router = express.Router();


router.get('', requireAuth(),ordersController.getOrders);

export default router;