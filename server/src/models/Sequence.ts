import mongoose from 'mongoose';

const sequenceStepSchema = new mongoose.Schema({
  stepNumber: { type: Number, required: true },
  type: { type: String, enum: ['email', 'call', 'follow_up_email', 'final_follow_up'], required: true },
  day: { type: Number, required: true },
  label: String,
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate' },
  status: { type: String, enum: ['pending', 'completed', 'skipped'], default: 'pending' },
  completedAt: Date,
  notes: String,
});

const sequenceSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  name: { type: String, default: 'Default Outreach' },
  steps: [sequenceStepSchema],
  currentStep: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'completed', 'paused', 'cancelled'], default: 'active' },
  completedAt: Date,
}, { timestamps: true });

export default mongoose.model('Sequence', sequenceSchema);
