import express from 'express';
import ordersController from '../controllers/Orders';
const router = express.Router();


router.get('', ordersController.getOrders);

export default router;