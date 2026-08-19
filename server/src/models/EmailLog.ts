import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailTemplate' },
  from: { type: String, required: true },
  to: { type: String, required: true },
  subject: { type: String, required: true },
  htmlContent: { type: String, required: true },
  status: { type: String, enum: ['queued', 'sent', 'delivered', 'opened', 'replied', 'bounced', 'failed'], default: 'queued' },
  sequenceStep: Number,
  sentAt: Date,
  deliveredAt: Date,
  openedAt: Date,
  repliedAt: Date,
  errorMessage: String,
  smtpResponse: String,
}, { timestamps: true });

export default mongoose.model('EmailLog', emailLogSchema);
