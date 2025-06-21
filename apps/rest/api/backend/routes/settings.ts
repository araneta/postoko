import express from 'express';
import SettingsController from '../controllers/Settings';
const router = express.Router();


router.get('', SettingsController.getSettings);

export default router;