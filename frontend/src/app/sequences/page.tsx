"use client";

import { useState, useEffect, useCallback } from "react";
import { sequencesAPI, leadsAPI, emailAPI } from "@/lib/api";
import { cn, formatDate, getTemperatureColor } from "@/lib/utils";

interface Lead {
  _id: string;
  businessName: string;
  email: string;
  phone: string;
  leadTemperature: string;
}

interface SequenceStep {
  stepNumber: number;
  type: string;
  label: string;
  day: number;
  status: "pending" | "completed" | "skipped";
  notes?: string;
}

interface Sequence {
  _id: string;
  leadId: Lead;
  steps: SequenceStep[];
  currentStep: number;
  status: string;
  startedAt: string;
  createdAt: string;
}

const DEFAULT_STEPS = [
  { stepNumber: 1, type: "email", label: "Day 1: Initial Email", day: 1 },
  { stepNumber: 2, type: "call", label: "Day 1/2: Phone Call", day: 2 },
  { stepNumber: 3, type: "follow_up_email", label: "Day 4: Follow-up Email", day: 4 },
  { stepNumber: 4, type: "call", label: "Day 7: Second Call", day: 7 },
  { stepNumber: 5, type: "final_follow_up", label: "Day 12: Final Follow-up", day: 12 },
];

export default function SequencesPage() {
  const [view, setView] = useState<"due" | "all">("due");
  const [dueItems, setDueItems] = useState<any[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedSequence, setSelectedSequence] = useState<Sequence | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newLeadId, setNewLeadId] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [callTarget, setCallTarget] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadDueSequences = useCallback(async () => {
    try {
      const res = await sequencesAPI.getDue();
      setDueItems(res.data.sequences || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadAllSequences = useCallback(async () => {
    try {
      const res = await sequencesAPI.getAll({ status: "active" });
      setSequences(res.data.sequences || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadLeads = useCallback(async () => {
    try {
      const res = await leadsAPI.getAll({ limit: 200 });
      setLeads(res.data.leads || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadDueSequences(), loadAllSequences(), loadLeads()])
      .finally(() => setLoading(false));
  }, [loadDueSequences, loadAllSequences, loadLeads]);

  const handleStepAction = async (sequenceId: string, stepNumber: number, status: "completed" | "skipped") => {
    setActionLoading(`${sequenceId}-${stepNumber}`);
    try {
      await sequencesAPI.updateStep(sequenceId, { stepNumber, status });
      showToast("success", `Step ${stepNumber} marked as ${status}`);
      loadDueSequences();
      loadAllSequences();
      if (selectedSequence?._id === sequenceId) {
        const res = await sequencesAPI.getAll({});
        const updated = (res.data.sequences || []).find((s: Sequence) => s._id === sequenceId);
        if (updated) setSelectedSequence(updated);
      }
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to update step");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSequence = async () => {
    if (!newLeadId) return;
    try {
      await sequencesAPI.create({ leadId: newLeadId });
      showToast("success", "Sequence created successfully");
      setShowNewModal(false);
      setNewLeadId("");
      loadDueSequences();
      loadAllSequences();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to create sequence");
    }
  };

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case "email":
      case "follow_up_email":
      case "final_follow_up":
        return "📧";
      case "call":
        return "📞";
      default:
        return "📋";
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "skipped": return "bg-gray-100 text-gray-500 border-gray-200";
      default: return "bg-blue-50 text-blue-800 border-blue-200";
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="text-gray-500">Loading sequences...</div></div>;
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={cn("fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium", toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white")}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-up Sequences</h1>
          <p className="text-gray-500 mt-1">5-step outreach: Email → Call → Email → Call → Final Email</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          + New Sequence
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-0">
        <button onClick={() => setView("due")} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", view === "due" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}>
          Due Today ({dueItems.length})
        </button>
        <button onClick={() => setView("all")} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors", view === "all" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}>
          All Active ({sequences.length})
        </button>
      </div>

      {view === "due" && (
        <div className="space-y-3">
          {dueItems.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No sequences due today. All caught up!</p>
            </div>
          ) : (
            dueItems.map((item: any, i: number) => {
              const lead = item.sequence?.leadId;
              return (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium text-gray-900">{lead?.businessName || "Unknown Lead"}</p>
                        <p className="text-sm text-gray-500">
                          {item.dueSteps?.map((s: any) => s.label).join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lead?.leadTemperature && (
                        <span className={cn("text-xs px-2 py-1 rounded-full font-medium border", getTemperatureColor(lead.leadTemperature))}>
                          {lead.leadTemperature}
                        </span>
                      )}
                      {item.dueSteps?.map((step: any) => (
                        <div key={step.stepNumber} className="flex gap-1">
                          {step.type === "call" ? (
                            <button
                              onClick={() => setCallTarget(`${item.sequence._id}-${step.stepNumber}`)}
                              disabled={actionLoading === `${item.sequence._id}-${step.stepNumber}`}
                              className="px-3 py-1.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                            >
                              Log Call
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStepAction(item.sequence._id, step.stepNumber, "completed")}
                              disabled={actionLoading === `${item.sequence._id}-${step.stepNumber}`}
                              className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => handleStepAction(item.sequence._id, step.stepNumber, "skipped")}
                            disabled={actionLoading === `${item.sequence._id}-${step.stepNumber}`}
                            className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Skip
                          </button>
                        </div>
                      ))}
                      <button onClick={() => setSelectedSequence(item.sequence)} className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {view === "all" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {sequences.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No active sequences</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Lead</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Progress</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Step</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Started</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sequences.map((seq) => {
                  const lead = seq.leadId as Lead;
                  const completedSteps = seq.steps?.filter((s) => s.status === "completed").length || 0;
                  const totalSteps = seq.steps?.length || 5;
                  const progressPct = (completedSteps / totalSteps) * 100;

                  return (
                    <tr key={seq._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{lead?.businessName || "Unknown"}</p>
                        <p className="text-xs text-gray-500">{lead?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progressPct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{completedSteps}/{totalSteps}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">Step {seq.currentStep}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(seq.startedAt || seq.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelectedSequence(seq)} className="text-sm text-blue-600 hover:text-blue-700">View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedSequence && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Sequence Details</h2>
              <button onClick={() => setSelectedSequence(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3">
              {(selectedSequence.steps || DEFAULT_STEPS).map((step) => (
                <div key={step.stepNumber} className={cn("flex items-center justify-between p-3 rounded-lg border", getStepStatusColor(step.status || "pending"))}>
                  <div className="flex items-center gap-3">
                    <span>{getStepTypeIcon(step.type)}</span>
                    <div>
                      <p className="text-sm font-medium">{step.label}</p>
                      <p className="text-xs opacity-70">Day {step.day}</p>
                    </div>
                  </div>
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium capitalize",
                    step.status === "completed" ? "bg-green-200 text-green-900" :
                    step.status === "skipped" ? "bg-gray-200 text-gray-600" :
                    "bg-blue-200 text-blue-900"
                  )}>
                    {step.status || "pending"}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setSelectedSequence(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {callTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Log Call</h2>
            <textarea
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              rows={3}
              placeholder="Call notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setCallTarget(null); setCallNotes(""); }} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button
                onClick={() => {
                  const [seqId, stepNum] = callTarget.split("-");
                  handleStepAction(seqId, parseInt(stepNum), "completed");
                  setCallTarget(null);
                  setCallNotes("");
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Start New Sequence</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Lead</label>
              <select value={newLeadId} onChange={(e) => setNewLeadId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Choose a lead...</option>
                {leads.map((lead) => (
                  <option key={lead._id} value={lead._id}>{lead.businessName} ({lead.email || "no email"})</option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Sequence Steps:</p>
              {DEFAULT_STEPS.map((step) => (
                <div key={step.stepNumber} className="flex items-center gap-2 py-1.5 text-sm text-gray-600">
                  <span>{getStepTypeIcon(step.type)}</span>
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowNewModal(false); setNewLeadId(""); }} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleCreateSequence} disabled={!newLeadId} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400">Create Sequence</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
