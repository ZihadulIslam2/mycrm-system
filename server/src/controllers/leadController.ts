import { Request, Response } from 'express';
import Lead, { ILead } from '../models/Lead';
import { calculateLeadScore } from '../utils/leadScoring';

export const getLeads = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      sort = 'createdAt',
      order = 'desc',
      search,
      temperature,
      finalStatus,
      niche,
      city,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {};

    if (temperature) filter.leadTemperature = temperature;
    if (finalStatus) filter.finalStatus = finalStatus;
    if (niche) filter.niche = { $regex: niche, $options: 'i' };
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (search) {
      filter.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { niche: { $regex: search, $options: 'i' } },
      ];
    }

    const sortDir = order === 'asc' ? 1 : -1;
    const [leads, total] = await Promise.all([
      Lead.find(filter).sort({ [sort as string]: sortDir }).skip(skip).limit(limitNum),
      Lead.countDocuments(filter),
    ]);

    res.json({
      leads,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching leads', error: error.message });
  }
};

export const getLeadById = async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json(lead);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching lead', error: error.message });
  }
};

export const createLead = async (req: Request, res: Response) => {
  try {
    const leadData = req.body;
    const scoreBreakdown = calculateLeadScore(leadData);
    leadData.leadScore = scoreBreakdown.total;
    leadData.leadTemperature = scoreBreakdown.temperature;
    leadData.scoreBreakdown = scoreBreakdown;

    if (!leadData.leadId) {
      const count = await Lead.countDocuments();
      leadData.leadId = `LEAD-${String(count + 1).padStart(5, '0')}`;
    }

    const lead = new Lead(leadData);
    await lead.save();
    res.status(201).json(lead);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Lead with this ID already exists' });
    }
    res.status(500).json({ message: 'Error creating lead', error: error.message });
  }
};

export const updateLead = async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const updatedData = { ...req.body };
    delete updatedData._id;
    delete updatedData.leadId;

    Object.assign(lead, updatedData);

    const scoreBreakdown = calculateLeadScore(lead.toObject());
    lead.leadScore = scoreBreakdown.total;
    lead.leadTemperature = scoreBreakdown.temperature;
    (lead as any).scoreBreakdown = scoreBreakdown;

    await lead.save();
    res.json(lead);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate field value' });
    }
    res.status(500).json({ message: 'Error updating lead', error: error.message });
  }
};

export const deleteLead = async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json({ message: 'Lead deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting lead', error: error.message });
  }
};

export const bulkUploadLeads = async (req: Request, res: Response) => {
  try {
    const { leads: leadsData } = req.body;

    if (!Array.isArray(leadsData) || leadsData.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of leads' });
    }

    if (leadsData.length > 500) {
      return res.status(400).json({ message: 'Maximum 500 leads per bulk upload' });
    }

    const count = await Lead.countDocuments();

    const scoredLeads = leadsData.map((leadData: Partial<ILead>, index: number) => {
      const scoreBreakdown = calculateLeadScore(leadData);
      return {
        ...leadData,
        leadId: leadData.leadId || `LEAD-${String(count + index + 1).padStart(5, '0')}`,
        leadScore: scoreBreakdown.total,
        leadTemperature: scoreBreakdown.temperature,
        scoreBreakdown,
      };
    });

    const results = await Lead.insertMany(scoredLeads, { ordered: false }).catch((err) => {
      const inserted = err.insertedDocs || [];
      return { inserted, errors: err.writeErrors?.length || 0 };
    });

    const insertedCount = Array.isArray(results) ? results.length : results.inserted?.length || 0;

    res.status(201).json({
      message: `${insertedCount} leads uploaded successfully`,
      inserted: insertedCount,
      errors: Array.isArray(results) ? 0 : results.errors,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error bulk uploading leads', error: error.message });
  }
};

export const updateLeadField = async (req: Request, res: Response) => {
  try {
    const { field, value } = req.body;

    if (!field) {
      return res.status(400).json({ message: 'Field name is required' });
    }

    const allowedFields = [
      'businessName', 'email', 'phone', 'website',
      'niche', 'city', 'googleMapsUrl', 'websiteStatus',
      'mobileStatus', 'bookingSystem', 'reviews', 'rating',
      'finalStatus', 'notes', 'tags', 'leadScore', 'leadTemperature',
      'emailStatus', 'callStatus', 'interested', 'proposal', 'upwork',
      'dealValue', 'response', 'mainProblem', 'followUpDate',
      'meetingDate', 'assignedTo', 'source',
    ];

    if (!allowedFields.includes(field)) {
      return res.status(400).json({ message: `Field '${field}' is not allowed for single update` });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    (lead as any)[field] = value;

    if (['websiteStatus', 'mobileStatus', 'bookingSystem', 'reviews', 'rating', 'email', 'phone'].includes(field)) {
      const scoreBreakdown = calculateLeadScore(lead.toObject());
      lead.leadScore = scoreBreakdown.total;
      lead.leadTemperature = scoreBreakdown.temperature;
    }

    await lead.save();
    res.json(lead);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating lead field', error: error.message });
  }
};

export const getLeadStats = async (_req: Request, res: Response) => {
  try {
    const [totalLeads, byTemperature, byStatus, byNiche, byCity] = await Promise.all([
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
      Lead.aggregate([
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.json({
      totalLeads,
      byTemperature: byTemperature.reduce((acc: Record<string, number>, item: any) => {
        acc[item._id || 'Unknown'] = item.count;
        return acc;
      }, {}),
      byStatus: byStatus.reduce((acc: Record<string, number>, item: any) => {
        acc[item._id || 'Unknown'] = item.count;
        return acc;
      }, {}),
      byNiche: byNiche.map((item: any) => ({ niche: item._id || 'Unknown', count: item.count })),
      byCity: byCity.map((item: any) => ({ city: item._id || 'Unknown', count: item.count })),
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching lead stats', error: error.message });
  }
};
