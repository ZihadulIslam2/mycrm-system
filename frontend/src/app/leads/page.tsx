"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { leadsAPI } from "@/lib/api";
import { cn, formatDate, getTemperatureColor, getStatusColor } from "@/lib/utils";

interface Lead {
  _id: string;
  leadId: string;
  businessName: string;
  niche: string;
  city: string;
  website: string;
  email: string;
  phone: string;
  googleMapsUrl: string;
  rating: number;
  reviews: number;
  websiteStatus: string;
  mobileStatus: string;
  bookingSystem: string;
  mainProblem: string;
  leadScore: number;
  leadTemperature: string;
  emailStatus: string;
  callStatus: string;
  interested: string;
  proposal: string;
  upwork: string;
  dealValue: number;
  finalStatus: string;
  notes: string;
  source: string;
  scoreBreakdown?: any;
  createdAt: string;
}

type SortField = "businessName" | "niche" | "city" | "rating" | "reviews" | "leadScore" | "leadTemperature" | "finalStatus" | "createdAt";
type SortDir = "asc" | "desc";

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [search, setSearch] = useState("");
  const [filterTemp, setFilterTemp] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterNiche, setFilterNiche] = useState("");
  const [filterCity, setFilterCity] = useState("");

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [saving, setSaving] = useState(false);

  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit,
        sort: sortField,
        order: sortDir,
      };
      if (search) params.search = search;
      if (filterTemp) params.temperature = filterTemp;
      if (filterStatus) params.finalStatus = filterStatus;
      if (filterNiche) params.niche = filterNiche;
      if (filterCity) params.city = filterCity;

      const res = await leadsAPI.getAll(params);
      setLeads(res.data.leads || []);
      setTotalCount(res.data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to load leads:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortField, sortDir, search, filterTemp, filterStatus, filterNiche, filterCity]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-blue-600 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const openEditModal = (lead: Lead) => {
    setSelectedLead(lead);
    setEditForm({ ...lead });
  };

  const handleSaveLead = async () => {
    if (!selectedLead) return;
    setSaving(true);
    try {
      await leadsAPI.update(selectedLead._id, editForm);
      setSelectedLead(null);
      loadLeads();
    } catch (err) {
      console.error("Failed to save lead:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await leadsAPI.delete(deleteId);
      setDeleteId(null);
      loadLeads();
    } catch (err) {
      console.error("Failed to delete lead:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCsvImport = async () => {
    if (!csvText.trim()) return;
    setCsvUploading(true);
    setCsvResult(null);
    try {
      const lines = csvText.trim().split("\n");
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const rows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || "";
        });
        rows.push(row);
      }

      const mappedLeads = rows.map((row) => ({
        businessName: row["business name"] || row["businessname"] || row["name"] || "",
        niche: row["niche"] || row["industry"] || "",
        city: row["city"] || row["location"] || "",
        website: row["website"] || row["url"] || "",
        email: row["email"] || "",
        phone: row["phone"] || row["telephone"] || "",
        rating: parseFloat(row["rating"] || "0") || 0,
        reviews: parseInt(row["reviews"] || row["review count"] || "0") || 0,
        source: row["source"] || "csv_import",
        notes: row["notes"] || "",
        googleMapsUrl: row["google maps url"] || row["googlemapsurl"] || row["maps"] || "",
        websiteStatus: row["website status"] || "none",
        mobileStatus: row["mobile status"] || "none",
        bookingSystem: row["booking system"] || "none",
        mainProblem: row["main problem"] || row["problem"] || "",
      }));

      const res = await leadsAPI.bulkUpload(mappedLeads);
      const imported = res.data?.inserted || mappedLeads.length;
      setCsvResult(`Successfully imported ${imported} leads.`);
      setCsvText("");
      loadLeads();
    } catch (err: any) {
      setCsvResult(`Error: ${err.response?.data?.message || "Import failed"}`);
    } finally {
      setCsvUploading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 mt-1">{totalCount} total leads</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCsvModal(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Import CSV
          </button>
          <button
            onClick={() => router.push("/leads/new")}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Lead
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={filterTemp}
            onChange={(e) => { setFilterTemp(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Temperatures</option>
            <option value="HOT">HOT</option>
            <option value="WARM">WARM</option>
            <option value="LOW">LOW</option>
            <option value="SKIP">SKIP</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="meeting_scheduled">Meeting Scheduled</option>
            <option value="proposal_sent">Proposal Sent</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
          <input
            type="text"
            placeholder="Filter by niche..."
            value={filterNiche}
            onChange={(e) => { setFilterNiche(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Filter by city..."
            value={filterCity}
            onChange={(e) => { setFilterCity(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading leads...</div>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p className="text-lg font-medium">No leads found</p>
            <p className="text-sm mt-1">Try adjusting your filters or add a new lead</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th onClick={() => handleSort("businessName")} className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900 whitespace-nowrap">
                    Business Name<SortIcon field="businessName" />
                  </th>
                  <th onClick={() => handleSort("niche")} className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900 whitespace-nowrap">
                    Niche<SortIcon field="niche" />
                  </th>
                  <th onClick={() => handleSort("city")} className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900 whitespace-nowrap">
                    City<SortIcon field="city" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Website</th>
                  <th onClick={() => handleSort("rating")} className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900 whitespace-nowrap">
                    Rating<SortIcon field="rating" />
                  </th>
                  <th onClick={() => handleSort("reviews")} className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900 whitespace-nowrap">
                    Reviews<SortIcon field="reviews" />
                  </th>
                  <th onClick={() => handleSort("leadScore")} className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900 whitespace-nowrap">
                    Score<SortIcon field="leadScore" />
                  </th>
                  <th onClick={() => handleSort("leadTemperature")} className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900 whitespace-nowrap">
                    Temp<SortIcon field="leadTemperature" />
                  </th>
                  <th onClick={() => handleSort("finalStatus")} className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900 whitespace-nowrap">
                    Status<SortIcon field="finalStatus" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr key={lead._id} onClick={() => openEditModal(lead)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      <div>
                        <p className="font-medium">{lead.businessName}</p>
                        <p className="text-xs text-gray-500">{lead.leadId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.niche || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.city || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {lead.website ? (
                        <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:text-blue-700 truncate max-w-[150px] block">
                          {lead.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.rating ? `${lead.rating}` : "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.reviews || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{lead.leadScore || 0}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn("text-xs px-2 py-1 rounded-full font-medium border", getTemperatureColor(lead.leadTemperature))}>
                        {lead.leadTemperature}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn("text-xs px-2 py-1 rounded-full font-medium capitalize", getStatusColor(lead.finalStatus))}>
                        {lead.finalStatus?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => openEditModal(lead)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">Edit</button>
                        <button onClick={() => setDeleteId(lead._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalCount)} of {totalCount}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Previous</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)} className={cn("px-3 py-1.5 text-sm border rounded-lg", page === pageNum ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50")}>
                    {pageNum}
                  </button>
                );
              })}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Edit Lead - {selectedLead.businessName}</h2>
                <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {selectedLead.scoreBreakdown && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Score Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { label: "Website", value: selectedLead.scoreBreakdown.website, max: 30, color: "bg-blue-500" },
                      { label: "Business", value: selectedLead.scoreBreakdown.businessOpportunity, max: 25, color: "bg-green-500" },
                      { label: "Booking", value: selectedLead.scoreBreakdown.bookingConversion, max: 20, color: "bg-purple-500" },
                      { label: "Google", value: selectedLead.scoreBreakdown.googlePresence, max: 15, color: "bg-orange-500" },
                      { label: "Contact", value: selectedLead.scoreBreakdown.contactability, max: 10, color: "bg-teal-500" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-medium">{item.value}/{item.max}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`${item.color} h-2 rounded-full`} style={{ width: `${(item.value / item.max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Score</span>
                    <span className="text-lg font-bold text-gray-900">{selectedLead.leadScore} / 100</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input type="text" value={editForm.businessName || ""} onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Niche</label>
                  <input type="text" value={editForm.niche || ""} onChange={(e) => setEditForm({ ...editForm, niche: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" value={editForm.city || ""} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input type="url" value={editForm.website || ""} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps URL</label>
                  <input type="url" value={editForm.googleMapsUrl || ""} onChange={(e) => setEditForm({ ...editForm, googleMapsUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <input type="number" step="0.1" min="0" max="5" value={editForm.rating || ""} onChange={(e) => setEditForm({ ...editForm, rating: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reviews</label>
                  <input type="number" min="0" value={editForm.reviews || ""} onChange={(e) => setEditForm({ ...editForm, reviews: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website Status</label>
                  <select value={editForm.websiteStatus || "none"} onChange={(e) => setEditForm({ ...editForm, websiteStatus: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="none">No Website</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="poor">Poor</option>
                    <option value="outdated">Outdated</option>
                    <option value="broken">Broken</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Status</label>
                  <select value={editForm.mobileStatus || "none"} onChange={(e) => setEditForm({ ...editForm, mobileStatus: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="none">N/A</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Booking System</label>
                  <select value={editForm.bookingSystem || "none"} onChange={(e) => setEditForm({ ...editForm, bookingSystem: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="none">No Booking</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                  <select value={editForm.leadTemperature || "LOW"} onChange={(e) => setEditForm({ ...editForm, leadTemperature: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="HOT">HOT</option>
                    <option value="WARM">WARM</option>
                    <option value="LOW">LOW</option>
                    <option value="SKIP">SKIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={editForm.finalStatus || "new"} onChange={(e) => setEditForm({ ...editForm, finalStatus: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="meeting_scheduled">Meeting Scheduled</option>
                    <option value="proposal_sent">Proposal Sent</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interested</label>
                  <select value={editForm.interested || "pending"} onChange={(e) => setEditForm({ ...editForm, interested: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="pending">Pending</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="maybe">Maybe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deal Value ($)</label>
                  <input type="number" min="0" value={editForm.dealValue || ""} onChange={(e) => setEditForm({ ...editForm, dealValue: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Main Problem</label>
                  <input type="text" value={editForm.mainProblem || ""} onChange={(e) => setEditForm({ ...editForm, mainProblem: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <input type="text" value={editForm.source || ""} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={editForm.notes || ""} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setSelectedLead(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleSaveLead} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Lead</h2>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete this lead? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCsvModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Import CSV</h2>
                <button onClick={() => { setShowCsvModal(false); setCsvText(""); setCsvResult(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Paste CSV data below. First row should be headers.</p>
              <p className="text-xs text-gray-400">Columns: business name, niche, city, website, email, phone, rating, reviews, website status, mobile status, booking system, google maps url, notes, source</p>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={12}
                placeholder={"business name, niche, city, website, email, phone, rating, reviews\nAcme Corp, Dentistry, New York, acme.com, info@acme.com, 555-0123, 4.5, 320\nAnother Co, Restaurant, Boston, , hello@another.com, 555-0456, 4.2, 150"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {csvResult && (
                <div className={cn("p-3 rounded-lg text-sm", csvResult.startsWith("Error") ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700")}>
                  {csvResult}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => { setShowCsvModal(false); setCsvText(""); setCsvResult(null); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleCsvImport} disabled={csvUploading || !csvText.trim()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
                {csvUploading ? "Importing..." : "Import Leads"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
