import { Request, Response } from 'express';
import Lead from '../models/Lead';
import DailyLog from '../models/DailyLog';
import EmailLog from '../models/EmailLog';
import Sequence from '../models/Sequence';

export const getOverview = async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalLeads,
      leadsByTemperature,
      leadsByStatus,
      leadsByNiche,
      recentLeads,
      activeSequences,
      todayEmails,
    ] = await Promise.all([
      Lead.countDocuments(),
      Lead.aggregate([
        { $group: { _id: '$leadTemperature', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Lead.aggregate([
        { $group: { _id: '$finalStatus', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Lead.aggregate([
        { $group: { _id: '$niche', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Lead.find().sort({ createdAt: -1 }).limit(10)
        .select('businessName city niche leadTemperature leadScore createdAt'),
      Sequence.find({ status: 'active' })
        .populate('leadId', 'businessName'),
      EmailLog.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
      }),
    ]);

    const tempMap: Record<string, number> = {};
    leadsByTemperature.forEach((item: any) => {
      tempMap[item._id || 'Unknown'] = item.count;
    });

    let sequencesDueToday = 0;
    for (const seq of activeSequences) {
      const startedAt = new Date(seq.startedAt);
      const dayNumber = Math.floor((today.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const hasDue = seq.steps.some((s: any) => s.day <= dayNumber && s.status !== 'completed');
      if (hasDue) sequencesDueToday++;
    }

    const meetingsScheduled = await Lead.countDocuments({ finalStatus: 'meeting_scheduled' });

    res.json({
      totalLeads,
      leadsByTemperature: tempMap,
      leadsByStatus: leadsByStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item._id || 'Unknown'] = item.count;
        return acc;
      }, {}),
      leadsByNiche: leadsByNiche.map((item: any) => ({
        niche: item._id || 'Unknown',
        count: item.count,
      })),
      recentLeads,
      meetingsScheduled,
      todayActions: [
        ...activeSequences
          .filter((seq: any) => {
            const startedAt = new Date(seq.startedAt);
            const dayNum = Math.floor((today.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return seq.steps.some((s: any) => s.day <= dayNum && s.status !== 'completed');
          })
          .map((seq: any) => ({
            businessName: (seq.leadId as any)?.businessName || 'Unknown',
            action: `Step ${seq.currentStep}: Follow-up due`,
            temperature: (seq.leadId as any)?.leadTemperature || 'LOW',
          })),
      ],
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching dashboard overview', error: error.message });
  }
};

export const getFunnelData = async (_req: Request, res: Response) => {
  try {
    const [
      leadsCollected,
      leadsContacted,
      emailsSent,
      emailsDelivered,
      replies,
      callsAnswered,
      interested,
      meetings,
      proposals,
      contracts,
      revenueAgg,
    ] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ lastContactedAt: { $ne: null } }),
      EmailLog.countDocuments(),
      EmailLog.countDocuments({ status: { $in: ['sent', 'delivered'] } }),
      EmailLog.countDocuments({ status: 'replied' }),
      Lead.countDocuments({ callStatus: 'answered' }),
      Lead.countDocuments({ interested: 'yes' }),
      Lead.countDocuments({ finalStatus: 'meeting_scheduled' }),
      Lead.countDocuments({ proposal: { $in: ['sent', 'viewed', 'accepted'] } }),
      Lead.countDocuments({ finalStatus: 'won' }),
      Lead.aggregate([
        { $match: { finalStatus: 'won', dealValue: { $exists: true, $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$dealValue' } } },
      ]),
    ]);

    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    res.json({
      leadsCollected,
      leadsContacted,
      emailsSent,
      emailsDelivered,
      replies,
      callsAnswered,
      interested,
      meetings,
      proposals,
      contracts,
      revenue: totalRevenue,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching funnel data', error: error.message });
  }
};

export const getDailyLogs = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, page = '1', limit = '30' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      DailyLog.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum),
      DailyLog.countDocuments(filter),
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
    res.status(500).json({ message: 'Error fetching daily logs', error: error.message });
  }
};

export const createDailyLog = async (req: Request, res: Response) => {
  try {
    const {
      date,
      keywords,
      category,
      location,
      leadsCollected,
      leadsContacted,
      emailsSent,
      callsMade,
      replies,
      interested,
      meetings,
      notes,
      source,
    } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);

    const existingLog = await DailyLog.findOne({ date: logDate });

    if (existingLog) {
      if (keywords !== undefined) existingLog.keywords = keywords;
      if (category !== undefined) existingLog.category = category;
      if (location !== undefined) existingLog.location = location;
      if (leadsCollected !== undefined) existingLog.leadsCollected = leadsCollected;
      if (leadsContacted !== undefined) existingLog.leadsContacted = leadsContacted;
      if (emailsSent !== undefined) existingLog.emailsSent = emailsSent;
      if (callsMade !== undefined) existingLog.callsMade = callsMade;
      if (replies !== undefined) existingLog.replies = replies;
      if (interested !== undefined) existingLog.interested = interested;
      if (meetings !== undefined) existingLog.meetings = meetings;
      if (notes !== undefined) existingLog.notes = notes;
      if (source !== undefined) existingLog.source = source;

      await existingLog.save();
      res.json(existingLog);
    } else {
      const log = new DailyLog({
        date: logDate,
        keywords: keywords || [],
        category: category || '',
        location: location || '',
        leadsCollected: leadsCollected || 0,
        leadsContacted: leadsContacted || 0,
        emailsSent: emailsSent || 0,
        callsMade: callsMade || 0,
        replies: replies || 0,
        interested: interested || 0,
        meetings: meetings || 0,
        notes: notes || '',
        source: source || '',
      });
      await log.save();
      res.status(201).json(log);
    }
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Daily log already exists for this date' });
    }
    res.status(500).json({ message: 'Error creating daily log', error: error.message });
  }
};

export const getConversionRates = async (_req: Request, res: Response) => {
  try {
    const [
      totalLeads,
      contacted,
      emailsSent,
      emailsDelivered,
      replies,
      callsAnswered,
      interested,
      meetings,
      proposals,
      won,
      totalRevenue,
    ] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ lastContactedAt: { $ne: null } }),
      EmailLog.countDocuments(),
      EmailLog.countDocuments({ status: { $in: ['sent', 'delivered'] } }),
      EmailLog.countDocuments({ status: 'replied' }),
      Lead.countDocuments({ callStatus: 'answered' }),
      Lead.countDocuments({ interested: 'yes' }),
      Lead.countDocuments({ finalStatus: 'meeting_scheduled' }),
      Lead.countDocuments({ proposal: { $in: ['sent', 'viewed', 'accepted'] } }),
      Lead.countDocuments({ finalStatus: 'won' }),
      Lead.aggregate([
        { $match: { finalStatus: 'won', dealValue: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$dealValue' } } },
      ]).then((r: any[]) => r.length > 0 ? r[0].total : 0),
    ]);

    const safeRate = (num: number, denom: number) =>
      denom > 0 ? Math.round((num / denom) * 10000) / 100 : 0;

    res.json({
      totalLeads,
      revenue: totalRevenue,
      conversionRates: {
        contactRate: safeRate(contacted, totalLeads),
        emailDeliveryRate: safeRate(emailsDelivered, emailsSent),
        replyRate: safeRate(replies, emailsDelivered),
        callAnswerRate: safeRate(callsAnswered, contacted),
        interestRate: safeRate(interested, contacted),
        meetingRate: safeRate(meetings, interested),
        proposalRate: safeRate(proposals, meetings),
        winRate: safeRate(won, proposals),
        overallConversion: safeRate(won, totalLeads),
      },
      funnelCounts: {
        totalLeads,
        contacted,
        emailsSent,
        emailsDelivered,
        replies,
        callsAnswered,
        interested,
        meetings,
        proposals,
        won,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching conversion rates', error: error.message });
  }
};
