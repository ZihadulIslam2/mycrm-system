import express from 'express';
import {
  getOverview,
  getFunnelData,
  getDailyLogs,
  createDailyLog,
  getConversionRates,
} from '../controllers/dashboardController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/overview', getOverview);
router.get('/funnel', getFunnelData);
router.get('/conversions', getConversionRates);
router.get('/daily-logs', getDailyLogs);
router.post('/daily-logs', createDailyLog);

export default router;
