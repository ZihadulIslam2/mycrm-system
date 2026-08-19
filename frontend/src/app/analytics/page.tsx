"use client";

import { useState, useEffect } from "react";
import { dashboardAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

interface Overview {
  totalLeads?: number;
  totalEmails?: number;
  totalCalls?: number;
  totalSequences?: number;
  conversionRate?: number;
  responseRate?: number;
  avgLeadScore?: number;
  revenue?: number;
  statusBreakdown?: Record<string, number>;
  temperatureBreakdown?: Record<string, number>;
  nicheBreakdown?: Record<string, number>;
  cityBreakdown?: Record<string, number>;
  weeklyTrends?: { day: string; leads: number; emails: number; calls: number }[];
}

interface FunnelStage {
  name: string;
  count: number;
  percentage?: number;
}

const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#6b7280"];

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardAPI.getOverview().catch(() => ({ data: {} })),
      dashboardAPI.getConversions().catch(() => ({ data: {} })),
    ]).then(([overviewRes, funnelRes]) => {
      setOverview(overviewRes.data);
      const fd = funnelRes.data;
      setFunnel(fd?.funnel || fd?.stages || fd || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const totalLeads = overview?.totalLeads || 1;

  const tempData = overview?.temperatureBreakdown
    ? Object.entries(overview.temperatureBreakdown).map(([name, value]) => ({
        name: name.toUpperCase(),
        value,
      }))
    : [];

  const statusData = overview?.statusBreakdown
    ? Object.entries(overview.statusBreakdown).map(([name, value]) => ({
        name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value,
      }))
    : [];

  const nicheData = overview?.nicheBreakdown
    ? Object.entries(overview.nicheBreakdown).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    : [];

  const cityData = overview?.cityBreakdown
    ? Object.entries(overview.cityBreakdown).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    : [];

  const metrics = [
    { label: "Avg Lead Score", value: overview?.avgLeadScore?.toFixed(1) || "—", icon: "⭐", color: "bg-yellow-50 text-yellow-600" },
    { label: "Conversion Rate", value: overview?.conversionRate != null ? `${overview.conversionRate.toFixed(1)}%` : "—", icon: "📈", color: "bg-green-50 text-green-600" },
    { label: "Response Rate", value: overview?.responseRate != null ? `${overview.responseRate.toFixed(1)}%` : "—", icon: "💬", color: "bg-blue-50 text-blue-600" },
    { label: "Revenue", value: overview?.revenue != null ? `$${overview.revenue.toLocaleString()}` : "—", icon: "💰", color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Performance insights and pipeline metrics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{m.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{m.value}</p>
              </div>
              <div className={cn("p-3 rounded-lg", m.color)}>
                <span className="text-xl">{m.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
          {funnel.length > 0 ? (
            <div className="space-y-3">
              {funnel.map((stage, idx) => {
                const pct = stage.percentage ?? (totalLeads > 0 ? Math.round((stage.count / totalLeads) * 100) : 0);
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                      <span className="text-sm text-gray-500">{stage.count} ({pct}%)</span>
                    </div>
                    <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-lg transition-all flex items-center justify-end pr-3"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      >
                        {pct >= 10 && (
                          <span className="text-xs text-white font-medium">{pct}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <FunnelPlaceholder data={statusData} />
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Lead Temperature</h2>
          {tempData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={tempData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {tempData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-sm text-gray-400">No data</div>
          )}
        </div>
      </div>

      {overview?.weeklyTrends && overview.weeklyTrends.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Weekly Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overview.weeklyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="leads" fill="#3b82f6" name="Leads" radius={[4, 4, 0, 0]} />
              <Bar dataKey="emails" fill="#8b5cf6" name="Emails" radius={[4, 4, 0, 0]} />
              <Bar dataKey="calls" fill="#f59e0b" name="Calls" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {nicheData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Niche Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Niche</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Count</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase w-1/2">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {nicheData.map((item) => {
                  const maxVal = nicheData[0]?.value || 1;
                  const pct = Math.round((item.value / totalLeads) * 100);
                  return (
                    <tr key={item.name} className="hover:bg-gray-50">
                      <td className="py-3 text-sm font-medium text-gray-900 capitalize">{item.name}</td>
                      <td className="py-3 text-sm text-gray-700">{item.value}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-3 bg-indigo-500 rounded-full"
                              style={{ width: `${Math.max((item.value / maxVal) * 100, 2)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cityData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">City Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">City</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Count</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase w-1/2">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cityData.slice(0, 15).map((item) => {
                  const maxVal = cityData[0]?.value || 1;
                  return (
                    <tr key={item.name} className="hover:bg-gray-50">
                      <td className="py-3 text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="py-3 text-sm text-gray-700">{item.value}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-3 bg-teal-500 rounded-full"
                              style={{ width: `${Math.max((item.value / maxVal) * 100, 2)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right">
                            {Math.round((item.value / totalLeads) * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {statusData.length > 0 && !overview?.weeklyTrends && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Lead Status Distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function FunnelPlaceholder({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-60 text-sm text-gray-400">No funnel data</div>;
  }
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const colors = ["bg-blue-600", "bg-blue-500", "bg-blue-400", "bg-blue-300", "bg-blue-200"];

  return (
    <div className="space-y-2">
      {data.map((stage, idx) => {
        const width = Math.max((stage.value / maxVal) * 100, 8);
        return (
          <div key={idx}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700">{stage.name}</span>
              <span className="text-sm text-gray-500">{stage.value}</span>
            </div>
            <div className="h-7 bg-gray-100 rounded-lg overflow-hidden">
              <div
                className={cn("h-full rounded-lg", colors[idx % colors.length])}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
