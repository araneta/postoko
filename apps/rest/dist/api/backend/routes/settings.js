import express from 'express';
import SettingsController from '../controllers/Settings.js';
import { requireAuth } from '@clerk/express';
const router = express.Router();
router.get('', requireAuth(), SettingsController.getSettings);
router.put('', requireAuth(), SettingsController.saveSettings);
export default router;
