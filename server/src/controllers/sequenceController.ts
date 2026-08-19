import { Request, Response } from 'express';
import Sequence from '../models/Sequence';
import Lead from '../models/Lead';
import { getDefaultSequenceSteps } from '../utils/leadScoring';

export const getSequences = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', status } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};
    if (status) filter.status = status;

    const [sequences, total] = await Promise.all([
      Sequence.find(filter)
        .populate('leadId', 'businessName email phone city niche leadTemperature')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Sequence.countDocuments(filter),
    ]);

    res.json({
      sequences,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching sequences', error: error.message });
  }
};

export const getSequenceByLead = async (req: Request, res: Response) => {
  try {
    const sequence = await Sequence.findOne({ leadId: req.params.leadId })
      .populate('leadId', 'businessName email phone city niche leadTemperature');

    if (!sequence) {
      return res.status(404).json({ message: 'No sequence found for this lead' });
    }

    res.json(sequence);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching sequence', error: error.message });
  }
};

export const createSequence = async (req: Request, res: Response) => {
  try {
    const { leadId, customSteps } = req.body;

    if (!leadId) {
      return res.status(400).json({ message: 'Lead ID is required' });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const existingSequence = await Sequence.findOne({ leadId, status: 'active' });
    if (existingSequence) {
      return res.status(409).json({ message: 'Lead already has an active sequence' });
    }

    const steps = customSteps && customSteps.length > 0
      ? customSteps.map((step: any, index: number) => ({
          stepNumber: index + 1,
          type: step.type || 'email',
          day: step.day || index + 1,
          label: step.label || `Step ${index + 1}`,
          status: 'pending',
        }))
      : getDefaultSequenceSteps().map((step) => ({ ...step, status: 'pending' }));

    const sequence = new Sequence({
      leadId,
      steps,
      currentStep: 1,
      status: 'active',
      startedAt: new Date(),
    });

    await sequence.save();

    const populated = await sequence.populate('leadId', 'businessName email phone');

    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating sequence', error: error.message });
  }
};

export const updateSequenceStep = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stepNumber, status: stepStatus, notes } = req.body;

    if (stepNumber === undefined || !stepStatus) {
      return res.status(400).json({ message: 'Step number and status (completed/skipped) are required' });
    }

    if (!['completed', 'skipped'].includes(stepStatus)) {
      return res.status(400).json({ message: 'Status must be "completed" or "skipped"' });
    }

    const sequence = await Sequence.findById(id);
    if (!sequence) {
      return res.status(404).json({ message: 'Sequence not found' });
    }

    const step = sequence.steps.find((s: any) => s.stepNumber === stepNumber);
    if (!step) {
      return res.status(404).json({ message: `Step ${stepNumber} not found in sequence` });
    }

    if (step.status === 'completed') {
      return res.status(400).json({ message: `Step ${stepNumber} is already completed` });
    }

    step.status = stepStatus;
    if (notes) step.notes = notes;

    const maxStep = Math.max(...sequence.steps.map((s: any) => s.stepNumber));
    if (stepNumber < maxStep) {
      sequence.currentStep = stepNumber + 1;
    } else {
      sequence.status = 'completed';
      sequence.completedAt = new Date();
    }

    await sequence.save();

    res.json(sequence);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating sequence step', error: error.message });
  }
};

export const pauseSequence = async (req: Request, res: Response) => {
  try {
    const sequence = await Sequence.findById(req.params.id);
    if (!sequence) {
      return res.status(404).json({ message: 'Sequence not found' });
    }

    if (sequence.status !== 'active') {
      return res.status(400).json({ message: `Cannot pause a sequence with status: ${sequence.status}` });
    }

    sequence.status = 'paused';
    await sequence.save();

    res.json({ message: 'Sequence paused', sequence });
  } catch (error: any) {
    res.status(500).json({ message: 'Error pausing sequence', error: error.message });
  }
};

export const resumeSequence = async (req: Request, res: Response) => {
  try {
    const sequence = await Sequence.findById(req.params.id);
    if (!sequence) {
      return res.status(404).json({ message: 'Sequence not found' });
    }

    if (sequence.status !== 'paused') {
      return res.status(400).json({ message: `Cannot resume a sequence with status: ${sequence.status}` });
    }

    sequence.status = 'active';
    await sequence.save();

    res.json({ message: 'Sequence resumed', sequence });
  } catch (error: any) {
    res.status(500).json({ message: 'Error resuming sequence', error: error.message });
  }
};

export const cancelSequence = async (req: Request, res: Response) => {
  try {
    const sequence = await Sequence.findById(req.params.id);
    if (!sequence) {
      return res.status(404).json({ message: 'Sequence not found' });
    }

    if (sequence.status === 'completed' || sequence.status === 'cancelled') {
      return res.status(400).json({ message: `Cannot cancel a sequence with status: ${sequence.status}` });
    }

    sequence.status = 'cancelled';
    await sequence.save();

    res.json({ message: 'Sequence cancelled', sequence });
  } catch (error: any) {
    res.status(500).json({ message: 'Error cancelling sequence', error: error.message });
  }
};

export const getDueSequences = async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sequences = await Sequence.find({ status: 'active' })
      .populate('leadId', 'businessName email phone city niche leadTemperature');

    const dueSequences: any[] = [];

    for (const sequence of sequences) {
      const startedAt = new Date(sequence.startedAt);
      const dayNumber = Math.floor((today.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const steps = sequence.steps || [];
      const dueSteps = steps.filter((step: any) => step.day <= dayNumber && step.status !== 'completed');

      if (dueSteps.length > 0) {
        dueSequences.push({
          sequence,
          dayNumber,
          dueSteps: dueSteps.map((s: any) => ({
            stepNumber: s.stepNumber,
            type: s.type,
            label: s.label,
            day: s.day,
          })),
        });
      }
    }

    res.json({
      date: today.toISOString().split('T')[0],
      totalDue: dueSequences.length,
      sequences: dueSequences,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching due sequences', error: error.message });
  }
};
