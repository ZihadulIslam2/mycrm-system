"use client";

import { useState, useEffect, useCallback } from "react";
import { leadsAPI, emailAPI } from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";

interface Lead {
  _id: string;
  businessName: string;
  email: string;
  phone: string;
  leadTemperature: string;
}

interface EmailTemplate {
  _id: string;
  name: string;
  subject: string;
  htmlContent: string;
  category: string;
  usageCount: number;
  isActive: boolean;
}

interface EmailLog {
  _id: string;
  leadId: { _id: string; businessName: string; email: string } | null;
  to: string;
  subject: string;
  htmlContent: string;
  status: string;
  sentAt: string;
}

type Tab = "send" | "logs" | "templates";

export default function EmailPage() {
  const [activeTab, setActiveTab] = useState<Tab>("send");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {toast && (
        <div className={cn("fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium", toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white")}>
          {toast.message}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Center</h1>
        <p className="text-gray-500 mt-1">Send emails, manage templates, and track outreach</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {(["send", "logs", "templates"] as Tab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize", activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}>
            {tab === "send" ? "Send Email" : tab === "logs" ? "Email Logs" : "Templates"}
          </button>
        ))}
      </div>

      {activeTab === "send" && <SendEmailTab showToast={showToast} />}
      {activeTab === "logs" && <EmailLogsTab />}
      {activeTab === "templates" && <TemplatesTab showToast={showToast} />}
    </div>
  );
}

function SendEmailTab({ showToast }: { showToast: (type: "success" | "error", msg: string) => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [leadSearch, setLeadSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    leadsAPI.getAll({ limit: 500 }).then((res) => setLeads(res.data.leads || []));
    emailAPI.getTemplates().then((res) => setTemplates(Array.isArray(res.data) ? res.data : []));
  }, []);

  const filteredLeads = leads.filter((l) =>
    l.email && (l.businessName.toLowerCase().includes(leadSearch.toLowerCase()) || l.email.toLowerCase().includes(leadSearch.toLowerCase()))
  );

  const selectedLead = leads.find((l) => l._id === selectedLeadId);

  useEffect(() => {
    if (selectedTemplateId) {
      const tpl = templates.find((t) => t._id === selectedTemplateId);
      if (tpl) {
        setSubject(tpl.subject);
        setHtmlContent(tpl.htmlContent);
      }
    }
  }, [selectedTemplateId, templates]);

  const handleSend = async () => {
    if (!selectedLeadId || !subject || !htmlContent) {
      showToast("error", "Please select a lead and provide subject/content");
      return;
    }
    setSending(true);
    try {
      await emailAPI.send({ leadId: selectedLeadId, subject, html: htmlContent });
      showToast("success", "Email sent successfully!");
      setSubject("");
      setHtmlContent("");
      setSelectedLeadId("");
      setSelectedTemplateId("");
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const renderPreview = () => {
    let preview = htmlContent;
    if (selectedLead) {
      preview = preview.replace(/\{\{businessName\}\}/g, selectedLead.businessName || "");
      preview = preview.replace(/\{\{city\}\}/g, "");
      preview = preview.replace(/\{\{niche\}\}/g, "");
    }
    return preview;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Compose Email</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Lead</label>
          <input type="text" placeholder="Search leads by name or email..." value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1" />
          <select value={selectedLeadId} onChange={(e) => setSelectedLeadId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Choose a lead...</option>
            {filteredLeads.slice(0, 50).map((lead) => (
              <option key={lead._id} value={lead._id}>{lead.businessName} ({lead.email})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template (optional)</label>
          <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">No template</option>
            {templates.filter((t) => t.isActive).map((tpl) => (
              <option key={tpl._id} value={tpl._id}>{tpl.name} ({tpl.category})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email subject..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">HTML Content</label>
          <textarea value={htmlContent} onChange={(e) => setHtmlContent(e.target.value)} rows={12} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="<h1>Hello {{businessName}}</h1><p>We noticed your business in {{city}}...</p>" />
          <p className="text-xs text-gray-400 mt-1">Variables: {"{{businessName}}"}, {"{{city}}"}, {"{{niche}}"}</p>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setShowPreview(!showPreview)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">{showPreview ? "Hide" : "Show"} Preview</button>
          <button onClick={handleSend} disabled={sending || !selectedLeadId || !subject || !htmlContent} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
            {sending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
        {showPreview && htmlContent ? (
          <div className="border border-gray-200 rounded-lg p-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderPreview() }} />
        ) : (
          <div className="text-center text-gray-400 py-12">
            <p>Toggle preview to see how your email will look</p>
          </div>
        )}
      </div>
    </div>
  );
}

function EmailLogsTab() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await emailAPI.getLogs(params);
      setLogs(res.data.logs || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      sent: "bg-blue-100 text-blue-800",
      delivered: "bg-green-100 text-green-800",
      opened: "bg-purple-100 text-purple-800",
      replied: "bg-green-100 text-green-800",
      bounced: "bg-red-100 text-red-800",
      failed: "bg-red-100 text-red-800",
      queued: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="opened">Opened</option>
          <option value="replied">Replied</option>
          <option value="bounced">Bounced</option>
        </select>
      </div>
      {loading ? (
        <div className="p-12 text-center text-gray-500">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center text-gray-500">No email logs found</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Lead</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">To</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Subject</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Sent At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{(log.leadId as any)?.businessName || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{log.to}</td>
                <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]">{log.subject}</td>
                <td className="px-4 py-3"><span className={cn("text-xs px-2 py-1 rounded-full font-medium capitalize", getStatusBadge(log.status))}>{log.status}</span></td>
                <td className="px-4 py-3 text-gray-500">{log.sentAt ? formatDateTime(log.sentAt) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 p-4 border-t border-gray-200">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50">Prev</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}

function TemplatesTab({ showToast }: { showToast: (type: "success" | "error", msg: string) => void }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", subject: "", htmlContent: "", category: "custom" });

  const loadTemplates = useCallback(async () => {
    try {
      const res = await emailAPI.getTemplates();
      setTemplates(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const handleSave = async () => {
    try {
      if (editId) {
        await emailAPI.updateTemplate(editId, form);
        showToast("success", "Template updated");
      } else {
        await emailAPI.createTemplate(form);
        showToast("success", "Template created");
      }
      setShowForm(false);
      setEditId(null);
      setForm({ name: "", subject: "", htmlContent: "", category: "custom" });
      loadTemplates();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to save template");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try {
      await emailAPI.deleteTemplate(id);
      showToast("success", "Template deleted");
      loadTemplates();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: "", subject: "", htmlContent: "", category: "custom" }); }} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
          {showForm ? "Cancel" : "+ New Template"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">{editId ? "Edit Template" : "New Template"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Template name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="initial">Initial</option>
              <option value="follow_up">Follow Up</option>
              <option value="final">Final</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <input type="text" placeholder="Email subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea placeholder="HTML content (use {{businessName}}, {{city}}, {{niche}} for variables)" value={form.htmlContent} onChange={(e) => setForm({ ...form, htmlContent: e.target.value })} rows={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">Save Template</button>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No templates yet. Create one to get started.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div key={tpl._id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900">{tpl.name}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{tpl.category}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Subject: {tpl.subject}</p>
              <div className="text-xs text-gray-400 mb-3 line-clamp-3" dangerouslySetInnerHTML={{ __html: tpl.htmlContent.substring(0, 150) + "..." }} />
              <div className="flex gap-2">
                <button onClick={() => { setEditId(tpl._id); setForm({ name: tpl.name, subject: tpl.subject, htmlContent: tpl.htmlContent, category: tpl.category }); setShowForm(true); }} className="text-xs text-blue-600 hover:text-blue-700">Edit</button>
                <button onClick={() => handleDelete(tpl._id)} className="text-xs text-red-600 hover:text-red-700">Delete</button>
                <span className="text-xs text-gray-400 ml-auto">Used {tpl.usageCount || 0}x</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
