import express from 'express';
import {
  sendEmailToLead,
  getEmailLogs,
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  getTodaySequenceLeads,
} from '../controllers/emailController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/today-sequence', getTodaySequenceLeads);
router.get('/templates', getEmailTemplates);
router.post('/templates', createEmailTemplate);
router.put('/templates/:id', updateEmailTemplate);
router.delete('/templates/:id', deleteEmailTemplate);
router.post('/send', sendEmailToLead);
router.get('/logs', getEmailLogs);

export default router;
