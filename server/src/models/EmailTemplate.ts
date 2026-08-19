import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  htmlContent: { type: String, required: true },
  plainText: String,
  category: { type: String, enum: ['initial', 'follow_up', 'final', 'custom'], default: 'custom' },
  sequenceStep: Number,
  variables: [String],
  isActive: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('EmailTemplate', emailTemplateSchema);
