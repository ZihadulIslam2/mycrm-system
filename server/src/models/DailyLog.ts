import mongoose from 'mongoose';

const dailyLogSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  keywords: [String],
  category: String,
  location: String,
  leadsCollected: { type: Number, default: 0 },
  leadsContacted: { type: Number, default: 0 },
  emailsSent: { type: Number, default: 0 },
  callsMade: { type: Number, default: 0 },
  replies: { type: Number, default: 0 },
  interested: { type: Number, default: 0 },
  meetings: { type: Number, default: 0 },
  notes: String,
  source: String,
}, { timestamps: true });

dailyLogSchema.index({ date: -1 });

export default mongoose.model('DailyLog', dailyLogSchema);
