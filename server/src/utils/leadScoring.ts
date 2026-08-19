interface LeadInput {
  websiteStatus?: string | null;
  mobileStatus?: string | null;
  bookingSystem?: string | null;
  reviews?: number | null;
  rating?: number | null;
  email?: string | null;
  phone?: string | null;
  [key: string]: any;
}

interface ScoreBreakdown {
  website: number;
  businessOpportunity: number;
  bookingConversion: number;
  googlePresence: number;
  contactability: number;
  total: number;
  temperature: 'HOT' | 'WARM' | 'LOW' | 'SKIP';
}

export function calculateLeadScore(lead: LeadInput): ScoreBreakdown {
  let website = 0;
  let businessOpportunity = 0;
  let bookingConversion = 0;
  let googlePresence = 0;
  let contactability = 0;

  // Website scoring (max 30)
  switch (lead.websiteStatus) {
    case 'none': website = 30; break;
    case 'outdated': website = 25; break;
    case 'poor': website = 20; break;
    case 'broken': website = 15; break;
    case 'good': website = 5; break;
    case 'excellent': website = 0; break;
    default: website = 0;
  }

  // Mobile scoring adds to website (max 5 bonus)
  if (lead.mobileStatus === 'none' && website > 0) website = Math.min(30, website + 5);
  else if (lead.mobileStatus === 'poor') website = Math.min(30, website + 3);

  // Business opportunity (max 25) - based on reviews as proxy
  const reviews = lead.reviews || 0;
  if (reviews >= 500) businessOpportunity = 25;
  else if (reviews >= 200) businessOpportunity = 20;
  else if (reviews >= 100) businessOpportunity = 15;
  else if (reviews >= 50) businessOpportunity = 10;
  else if (reviews >= 10) businessOpportunity = 5;

  // Booking/conversion (max 20)
  switch (lead.bookingSystem) {
    case 'none': bookingConversion = 20; break;
    case 'poor': bookingConversion = 15; break;
    case 'good': bookingConversion = 5; break;
    case 'excellent': bookingConversion = 0; break;
    default: bookingConversion = 0;
  }

  // Google presence (max 15)
  const rating = lead.rating || 0;
  if (rating >= 4.0 && reviews >= 100 && website && websiteStatusIsPoor(lead.websiteStatus || undefined)) {
    googlePresence = 15;
  } else if (reviews >= 100) {
    googlePresence = 10;
  } else if (rating >= 4.0) {
    googlePresence = 5;
  }

  // Contactability (max 10)
  if (lead.email && lead.phone) contactability = 10;
  else if (lead.phone) contactability = 7;
  else if (lead.email) contactability = 5;

  const total = website + businessOpportunity + bookingConversion + googlePresence + contactability;

  let temperature: 'HOT' | 'WARM' | 'LOW' | 'SKIP' = 'SKIP';
  if (total >= 80) temperature = 'HOT';
  else if (total >= 60) temperature = 'WARM';
  else if (total >= 40) temperature = 'LOW';

  return { website, businessOpportunity, bookingConversion, googlePresence, contactability, total, temperature };
}

function websiteStatusIsPoor(status?: string | null): boolean {
  return ['none', 'outdated', 'poor', 'broken'].includes(status || '');
}

export function getDefaultSequenceSteps() {
  return [
    { stepNumber: 1, type: 'email', day: 1, label: 'Day 1: Initial Email' },
    { stepNumber: 2, type: 'call', day: 1, label: 'Day 1/2: Phone Call' },
    { stepNumber: 3, type: 'follow_up_email', day: 4, label: 'Day 4: Follow-up Email' },
    { stepNumber: 4, type: 'call', day: 7, label: 'Day 7: Second Call' },
    { stepNumber: 5, type: 'final_follow_up', day: 12, label: 'Day 12: Final Follow-up' },
  ];
}
