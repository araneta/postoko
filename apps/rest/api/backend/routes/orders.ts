import express from 'express';
import ordersController from '../controllers/Orders';
import { requireAuth } from '@clerk/express';
const router = express.Router();


router.get('', requireAuth(),ordersController.getOrders);
router.post('', requireAuth(), ordersController.createOrder);
router.get('/analytics', requireAuth(), ordersController.getAnalytics);
router.get('/reports', requireAuth(), ordersController.getSalesReport);
router.get('/best-sellers', requireAuth(), ordersController.getBestSellers);
router.get('/peak-hours', requireAuth(), ordersController.getPeakHours);
router.get('/profit-margin', requireAuth(), ordersController.getProfitMargin);

export default router;