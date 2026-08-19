import express from 'express';
import {
  getSequences,
  getSequenceByLead,
  createSequence,
  updateSequenceStep,
  pauseSequence,
  resumeSequence,
  cancelSequence,
  getDueSequences,
} from '../controllers/sequenceController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.get('/due', getDueSequences);
router.get('/', getSequences);
router.get('/lead/:leadId', getSequenceByLead);
router.post('/', createSequence);
router.patch('/:id/step', updateSequenceStep);
router.patch('/:id/pause', pauseSequence);
router.patch('/:id/resume', resumeSequence);
router.patch('/:id/cancel', cancelSequence);

export default router;
