"use client";

import { useState, useEffect, useCallback } from "react";
import { dashboardAPI } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

interface DailyLog {
  _id: string;
  date: string;
  keywords: string[];
  category: string;
  location: string;
  leadsCollected: number;
  leadsContacted: number;
  emailsSent: number;
  callsMade: number;
  replies: number;
  interested: number;
  meetings: number;
  notes: string;
  source: string;
  createdAt: string;
}

const INITIAL_FORM = {
  date: new Date().toISOString().split("T")[0],
  keywords: "",
  category: "",
  location: "",
  leadsCollected: 0,
  leadsContacted: 0,
  emailsSent: 0,
  callsMade: 0,
  replies: 0,
  interested: 0,
  meetings: 0,
  notes: "",
  source: "google_maps",
};

export default function DailyLogsPage() {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      const res = await dashboardAPI.getDailyLogs(params);
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        keywords: form.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      };
      await dashboardAPI.createDailyLog(payload);
      showToast("success", "Daily log saved!");
      setForm(INITIAL_FORM);
      loadLogs();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to save log");
    } finally {
      setSubmitting(false);
    }
  };

  const summary = {
    thisWeek: logs.filter((l) => {
      const d = new Date(l.date);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= weekAgo;
    }).reduce((sum, l) => sum + (l.leadsCollected || 0), 0),
    thisMonth: logs.filter((l) => {
      const d = new Date(l.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((sum, l) => sum + (l.leadsCollected || 0), 0),
    avgDaily: logs.length > 0 ? Math.round(logs.reduce((sum, l) => sum + (l.leadsCollected || 0), 0) / logs.length) : 0,
    totalLogs: logs.length,
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={cn("fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium", toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white")}>
          {toast.message}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daily Activity Logs</h1>
        <p className="text-gray-500 mt-1">Track your daily lead collection and outreach activities</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">This Week</p>
          <p className="text-2xl font-bold text-gray-900">{summary.thisWeek}</p>
          <p className="text-xs text-gray-400">leads collected</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-2xl font-bold text-gray-900">{summary.thisMonth}</p>
          <p className="text-xs text-gray-400">leads collected</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Daily Average</p>
          <p className="text-2xl font-bold text-gray-900">{summary.avgDaily}</p>
          <p className="text-xs text-gray-400">leads per day</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Logs</p>
          <p className="text-2xl font-bold text-gray-900">{summary.totalLogs}</p>
          <p className="text-xs text-gray-400">days tracked</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Log Today&apos;s Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (comma-separated)</label>
            <input type="text" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="dentist, salon, restaurant" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category / Niche</label>
            <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Dentistry" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="New York" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leads Collected</label>
            <input type="number" min="0" value={form.leadsCollected} onChange={(e) => setForm({ ...form, leadsCollected: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emails Sent</label>
            <input type="number" min="0" value={form.emailsSent} onChange={(e) => setForm({ ...form, emailsSent: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Calls Made</label>
            <input type="number" min="0" value={form.callsMade} onChange={(e) => setForm({ ...form, callsMade: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Replies</label>
            <input type="number" min="0" value={form.replies} onChange={(e) => setForm({ ...form, replies: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interested</label>
            <input type="number" min="0" value={form.interested} onChange={(e) => setForm({ ...form, interested: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meetings</label>
            <input type="number" min="0" value={form.meetings} onChange={(e) => setForm({ ...form, meetings: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <input type="text" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Any notes about today's activity..." />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
            {submitting ? "Saving..." : "Save Log"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">History</h2>
          <div className="flex gap-2 ml-auto">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-gray-400 self-center">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No logs found for this period</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {logs.map((log) => (
              <div key={log._id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{formatDate(log.date)}</h3>
                  {log.source && <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">{log.source}</span>}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div><p className="text-lg font-bold text-gray-900">{log.leadsCollected}</p><p className="text-xs text-gray-500">Leads</p></div>
                  <div><p className="text-lg font-bold text-blue-600">{log.emailsSent}</p><p className="text-xs text-gray-500">Emails</p></div>
                  <div><p className="text-lg font-bold text-orange-600">{log.callsMade}</p><p className="text-xs text-gray-500">Calls</p></div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div><p className="text-sm font-semibold text-green-600">{log.replies}</p><p className="text-xs text-gray-500">Replies</p></div>
                  <div><p className="text-sm font-semibold text-purple-600">{log.interested}</p><p className="text-xs text-gray-500">Interested</p></div>
                  <div><p className="text-sm font-semibold text-teal-600">{log.meetings}</p><p className="text-xs text-gray-500">Meetings</p></div>
                </div>
                {log.keywords && log.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {log.keywords.map((kw, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">{kw}</span>
                    ))}
                  </div>
                )}
                {log.category && <p className="text-xs text-gray-400 mt-2">Category: {log.category}</p>}
                {log.location && <p className="text-xs text-gray-400">Location: {log.location}</p>}
                {log.notes && <p className="text-xs text-gray-500 mt-2 italic">{log.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
