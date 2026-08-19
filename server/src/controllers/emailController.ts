import { Request, Response } from 'express';
import EmailLog from '../models/EmailLog';
import EmailTemplate from '../models/EmailTemplate';
import Lead from '../models/Lead';
import Sequence from '../models/Sequence';
import { sendEmail } from '../utils/emailService';
import { getDefaultSequenceSteps } from '../utils/leadScoring';

export const sendEmailToLead = async (req: Request, res: Response) => {
  try {
    const { leadId, templateId, subject, html } = req.body;

    if (!leadId) {
      return res.status(400).json({ message: 'Lead ID is required' });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    if (!lead.email) {
      return res.status(400).json({ message: 'Lead has no email address' });
    }

    let emailSubject = subject;
    let emailHtml = html;

    if (templateId && !emailSubject) {
      const template = await EmailTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({ message: 'Email template not found' });
      }
      emailSubject = template.subject;
      emailHtml = template.htmlContent;

      emailSubject = emailSubject
        .replace(/\{\{businessName\}\}/g, lead.businessName || '')
        .replace(/\{\{city\}\}/g, lead.city || '')
        .replace(/\{\{niche\}\}/g, lead.niche || '');

      emailHtml = emailHtml
        .replace(/\{\{businessName\}\}/g, lead.businessName || '')
        .replace(/\{\{city\}\}/g, lead.city || '')
        .replace(/\{\{niche\}\}/g, lead.niche || '');

      template.usageCount = (template.usageCount || 0) + 1;
      await template.save();
    }

    if (!emailSubject || !emailHtml) {
      return res.status(400).json({ message: 'Email subject and content are required' });
    }

    const result = await sendEmail({
      to: lead.email,
      subject: emailSubject,
      html: emailHtml,
    });

    const emailLog = new EmailLog({
      leadId: lead._id,
      to: lead.email,
      from: process.env.SMTP_USER || 'noreply@crm.com',
      subject: emailSubject,
      htmlContent: emailHtml,
      templateId: templateId || null,
      status: 'sent',
      sentAt: new Date(),
      smtpResponse: result.messageId,
    });
    await emailLog.save();

    lead.emailStatus = 'sent';
    lead.lastContactedAt = new Date();
    await lead.save();

    const sequence = await Sequence.findOne({ leadId: lead._id, status: 'active' });
    if (sequence) {
      const currentStepObj = sequence.steps.find(
        (s: any) => s.stepNumber === sequence.currentStep && (s.type === 'email' || s.type === 'follow_up_email' || s.type === 'final_follow_up')
      );
      if (currentStepObj) {
        currentStepObj.status = 'completed';
        const maxStep = Math.max(...sequence.steps.map((s: any) => s.stepNumber));
        if (sequence.currentStep < maxStep) {
          sequence.currentStep = sequence.currentStep + 1;
        } else {
          sequence.status = 'completed';
          sequence.completedAt = new Date();
        }
        await sequence.save();
      }
    }

    res.status(201).json({ message: 'Email sent successfully', emailLog });
  } catch (error: any) {
    res.status(500).json({ message: 'Error sending email', error: error.message });
  }
};

export const getEmailLogs = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      sort = 'createdAt',
      order = 'desc',
      leadId,
      status,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};
    if (leadId) filter.leadId = leadId;
    if (status) filter.status = status;

    const sortDir = order === 'asc' ? 1 : -1;
    const [logs, total] = await Promise.all([
      EmailLog.find(filter)
        .populate('leadId', 'businessName email')
        .populate('templateId', 'name subject')
        .sort({ [sort as string]: sortDir })
        .skip(skip)
        .limit(limitNum),
      EmailLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching email logs', error: error.message });
  }
};

export const getEmailTemplates = async (_req: Request, res: Response) => {
  try {
    const templates = await EmailTemplate.find().sort({ createdAt: -1 });
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching templates', error: error.message });
  }
};

export const createEmailTemplate = async (req: Request, res: Response) => {
  try {
    const { name, subject, htmlContent, category } = req.body;

    if (!name || !subject || !htmlContent) {
      return res.status(400).json({ message: 'Name, subject, and HTML content are required' });
    }

    const template = new EmailTemplate({
      name,
      subject,
      htmlContent,
      category: category || 'custom',
    });
    await template.save();
    res.status(201).json(template);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating template', error: error.message });
  }
};

export const updateEmailTemplate = async (req: Request, res: Response) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const allowed = ['name', 'subject', 'htmlContent', 'category', 'isActive'];
    for (const key of allowed) {
      if ((req.body as any)[key] !== undefined) {
        (template as any)[key] = (req.body as any)[key];
      }
    }

    await template.save();
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating template', error: error.message });
  }
};

export const deleteEmailTemplate = async (req: Request, res: Response) => {
  try {
    const template = await EmailTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.json({ message: 'Template deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting template', error: error.message });
  }
};

export const getTodaySequenceLeads = async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sequences = await Sequence.find({ status: 'active' })
      .populate('leadId', 'businessName email phone city niche leadTemperature');

    const todayActions: any[] = [];

    for (const sequence of sequences) {
      if (!sequence.leadId) continue;

      const startedAt = new Date(sequence.startedAt);
      const dayNumber = Math.floor((today.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const steps = sequence.steps || getDefaultSequenceSteps();
      const dueSteps = steps.filter((step: any) => step.day <= dayNumber && step.status !== 'completed');

      for (const step of dueSteps) {
        todayActions.push({
          sequenceId: sequence._id,
          lead: sequence.leadId,
          step: {
            stepNumber: step.stepNumber,
            type: step.type,
            label: step.label,
            day: step.day,
          },
          dayNumber,
          temperature: (sequence.leadId as any).leadTemperature,
        });
      }
    }

    res.json({
      date: today.toISOString().split('T')[0],
      totalActions: todayActions.length,
      actions: todayActions,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching today sequence leads', error: error.message });
  }
};
