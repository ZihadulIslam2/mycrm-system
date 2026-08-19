"use client";

import { useEffect, useState } from "react";
import { dashboardAPI, leadsAPI } from "@/lib/api";
import { StatCard } from "@/components/StatCard";
import { formatDate, getTemperatureColor } from "@/lib/utils";

export default function DashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [funnel, setFunnel] = useState<any>(null);
  const [todayActions, setTodayActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("crm_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
    }
    try {
      const [overviewRes, funnelRes] = await Promise.all([
        dashboardAPI.getOverview(),
        dashboardAPI.getFunnel(),
      ]);
      setOverview(overviewRes.data);
      setFunnel(funnelRes.data);
      setTodayActions(overviewRes.data?.todayActions || []);
    } catch (err: any) {
      if (err.response?.status !== 401) {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="text-gray-500">Loading dashboard...</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your CRM pipeline</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Leads" value={overview?.totalLeads || 0} icon="👥" color="blue" />
        <StatCard title="Hot Leads" value={overview?.leadsByTemperature?.HOT || 0} icon="🔥" color="red" />
        <StatCard title="Warm Leads" value={overview?.leadsByTemperature?.WARM || 0} icon="☀️" color="orange" />
        <StatCard title="Meetings Scheduled" value={overview?.meetingsScheduled || 0} icon="📅" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Actions</h2>
          {todayActions.length === 0 ? (
            <p className="text-gray-500 text-sm">No actions due today. Enjoy your day!</p>
          ) : (
            <div className="space-y-3">
              {todayActions.slice(0, 10).map((action: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{action.businessName || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{action.action}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getTemperatureColor(action.temperature || 'LOW')}`}>
                    {action.temperature || 'LOW'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Funnel</h2>
          {funnel && (
            <div className="space-y-3">
              {[
                { label: "Leads Collected", value: funnel.leadsCollected, pct: 100 },
                { label: "Leads Contacted", value: funnel.leadsContacted, pct: funnel.leadsCollected ? (funnel.leadsContacted / funnel.leadsCollected * 100) : 0 },
                { label: "Emails Delivered", value: funnel.emailsDelivered, pct: funnel.leadsCollected ? (funnel.emailsDelivered / funnel.leadsCollected * 100) : 0 },
                { label: "Replies", value: funnel.replies, pct: funnel.leadsCollected ? (funnel.replies / funnel.leadsCollected * 100) : 0 },
                { label: "Interested", value: funnel.interested, pct: funnel.leadsCollected ? (funnel.interested / funnel.leadsCollected * 100) : 0 },
                { label: "Meetings", value: funnel.meetings, pct: funnel.leadsCollected ? (funnel.meetings / funnel.leadsCollected * 100) : 0 },
                { label: "Proposals", value: funnel.proposals, pct: funnel.leadsCollected ? (funnel.proposals / funnel.leadsCollected * 100) : 0 },
                { label: "Contracts", value: funnel.contracts, pct: funnel.leadsCollected ? (funnel.contracts / funnel.leadsCollected * 100) : 0 },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, item.pct)}%` }} />
                  </div>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Revenue</span>
                  <span className="font-bold text-green-600">${funnel.revenue?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leads by Temperature */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Leads by Temperature</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['HOT', 'WARM', 'LOW', 'SKIP'].map((temp) => (
            <div key={temp} className={`p-4 rounded-lg border ${getTemperatureColor(temp)}`}>
              <p className="text-2xl font-bold">{overview?.leadsByTemperature?.[temp] || 0}</p>
              <p className="text-sm font-medium">{temp}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
