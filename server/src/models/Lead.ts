import mongoose from 'mongoose';

export interface ILead {
  _id?: string;
  leadId: string;
  businessName: string;
  niche?: string;
  city?: string;
  website?: string;
  phone?: string;
  email?: string;
  googleMapsUrl?: string;
  rating?: number;
  reviews?: number;
  websiteStatus?: 'excellent' | 'good' | 'poor' | 'outdated' | 'broken' | 'none';
  mobileStatus?: 'excellent' | 'good' | 'poor' | 'none';
  bookingSystem?: 'excellent' | 'good' | 'poor' | 'none';
  mainProblem?: string;
  leadScore: number;
  leadTemperature: 'HOT' | 'WARM' | 'LOW' | 'SKIP';
  emailStatus?: string;
  callStatus?: string;
  followUpDate?: Date;
  lastContactedAt?: Date;
  response?: string;
  interested?: 'yes' | 'no' | 'maybe' | 'pending';
  meetingDate?: Date;
  proposal?: string;
  upwork?: string;
  dealValue?: number;
  finalStatus?: string;
  notes?: string;
  tags?: string[];
  sequenceStep?: number;
  sequenceStartedAt?: Date;
  assignedTo?: string;
  source?: string;
  scoreBreakdown?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

const leadSchema = new mongoose.Schema({
  leadId: {
    type: String,
    unique: true,
    required: true,
  },
  businessName: {
    type: String,
    required: true,
  },
  niche: {
    type: String,
  },
  city: {
    type: String,
  },
  website: {
    type: String,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
  },
  googleMapsUrl: {
    type: String,
  },
  rating: {
    type: Number,
  },
  reviews: {
    type: Number,
  },
  websiteStatus: {
    type: String,
    enum: ['excellent', 'good', 'poor', 'outdated', 'broken', 'none'],
    default: 'none',
  },
  mobileStatus: {
    type: String,
    enum: ['excellent', 'good', 'poor', 'none'],
    default: 'none',
  },
  bookingSystem: {
    type: String,
    enum: ['excellent', 'good', 'poor', 'none'],
    default: 'none',
  },
  mainProblem: {
    type: String,
  },
  leadScore: {
    type: Number,
    default: 0,
  },
  leadTemperature: {
    type: String,
    enum: ['HOT', 'WARM', 'LOW', 'SKIP'],
    default: 'LOW',
  },
  emailStatus: {
    type: String,
    enum: ['not_sent', 'sent', 'delivered', 'opened', 'replied', 'bounced'],
    default: 'not_sent',
  },
  callStatus: {
    type: String,
    enum: ['not_called', 'attempted', 'answered', 'no_answer', 'callback_scheduled'],
    default: 'not_called',
  },
  followUpDate: {
    type: Date,
  },
  lastContactedAt: {
    type: Date,
  },
  response: {
    type: String,
  },
  interested: {
    type: String,
    enum: ['yes', 'no', 'maybe', 'pending'],
    default: 'pending',
  },
  meetingDate: {
    type: Date,
  },
  proposal: {
    type: String,
    enum: ['not_sent', 'sent', 'viewed', 'accepted', 'rejected'],
    default: 'not_sent',
  },
  upwork: {
    type: String,
    enum: ['not_submitted', 'submitted', 'shortlisted', 'hired', 'rejected'],
    default: 'not_submitted',
  },
  dealValue: {
    type: Number,
    default: 0,
  },
  finalStatus: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost'],
    default: 'new',
  },
  notes: {
    type: String,
  },
  tags: {
    type: [String],
  },
  sequenceStep: {
    type: Number,
    default: 0,
  },
  sequenceStartedAt: {
    type: Date,
  },
  assignedTo: {
    type: String,
  },
  source: {
    type: String,
  },
}, {
  timestamps: true,
});

leadSchema.index({ leadScore: -1 });
leadSchema.index({ leadTemperature: 1 });
leadSchema.index({ finalStatus: 1 });
leadSchema.index({ niche: 1 });
leadSchema.index({ city: 1 });

export default mongoose.model('Lead', leadSchema);
