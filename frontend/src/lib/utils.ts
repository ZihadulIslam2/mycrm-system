import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getTemperatureColor(temp: string) {
  switch (temp) {
    case 'HOT': return 'bg-red-100 text-red-800 border-red-200';
    case 'WARM': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'LOW': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'SKIP': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'won': return 'bg-green-100 text-green-800';
    case 'lost': return 'bg-red-100 text-red-800';
    case 'proposal_sent': return 'bg-blue-100 text-blue-800';
    case 'meeting_scheduled': return 'bg-purple-100 text-purple-800';
    case 'qualified': return 'bg-teal-100 text-teal-800';
    case 'contacted': return 'bg-indigo-100 text-indigo-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
