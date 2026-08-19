import express from 'express';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  bulkUploadLeads,
  updateLeadField,
  getLeadStats,
} from '../controllers/leadController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/stats', getLeadStats);
router.get('/', getLeads);
router.get('/:id', getLeadById);
router.post('/', createLead);
router.post('/bulk', bulkUploadLeads);
router.put('/:id', updateLead);
router.patch('/:id/field', updateLeadField);
router.delete('/:id', deleteLead);

export default router;
