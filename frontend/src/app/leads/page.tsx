"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { leadsAPI } from "@/lib/api";
import { cn, formatDate, getTemperatureColor, getStatusColor } from "@/lib/utils";
import {
  Copy,
  Check,
  FileJson,
  Upload,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit,
  CheckSquare,
  Square,
  MinusSquare,
  X,
  Code2
} from "lucide-react";

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

const SINGLE_LEAD_EXAMPLE = {
  businessName: "Apex Dental Clinic",
  niche: "Dentistry",
  city: "Austin, TX",
  website: "https://apexdentalclinic.com",
  email: "contact@apexdentalclinic.com",
  phone: "+1-512-555-0182",
  googleMapsUrl: "https://maps.google.com/?cid=12345678",
  rating: 4.8,
  reviews: 142,
  websiteStatus: "good",
  mobileStatus: "excellent",
  bookingSystem: "none",
  mainProblem: "No online patient booking integration",
  leadTemperature: "HOT",
  finalStatus: "new",
  dealValue: 2500,
  source: "json_import",
  notes: "High review volume, prospective for booking & website revamp"
};

const MULTIPLE_LEADS_EXAMPLE = [
  {
    businessName: "Apex Dental Clinic",
    niche: "Dentistry",
    city: "Austin, TX",
    website: "https://apexdentalclinic.com",
    email: "contact@apexdentalclinic.com",
    phone: "+1-512-555-0182",
    googleMapsUrl: "https://maps.google.com/?cid=12345678",
    rating: 4.8,
    reviews: 142,
    websiteStatus: "good",
    mobileStatus: "excellent",
    bookingSystem: "none",
    mainProblem: "No online patient booking integration",
    leadTemperature: "HOT",
    finalStatus: "new",
    dealValue: 2500,
    source: "json_import",
    notes: "High review volume, prospective for booking & website revamp"
  },
  {
    businessName: "Beacon Legal Advisory",
    niche: "Legal Services",
    city: "Chicago, IL",
    website: "https://beaconlegal.com",
    email: "info@beaconlegal.com",
    phone: "+1-312-555-0144",
    googleMapsUrl: "https://maps.google.com/?cid=87654321",
    rating: 4.9,
    reviews: 88,
    websiteStatus: "poor",
    mobileStatus: "poor",
    bookingSystem: "none",
    mainProblem: "Outdated website not mobile optimized",
    leadTemperature: "WARM",
    finalStatus: "qualified",
    dealValue: 4000,
    source: "json_import",
    notes: "Requested a quote for full website redesign"
  },
  {
    businessName: "Summit Fitness Studio",
    niche: "Fitness & Gym",
    city: "Miami, FL",
    website: "https://summitfitness.example.com",
    email: "hello@summitfitness.example.com",
    phone: "+1-305-555-0199",
    googleMapsUrl: "https://maps.google.com/?cid=55443322",
    rating: 4.6,
    reviews: 210,
    websiteStatus: "excellent",
    mobileStatus: "good",
    bookingSystem: "poor",
    mainProblem: "Booking system is buggy on mobile",
    leadTemperature: "HOT",
    finalStatus: "contacted",
    dealValue: 1800,
    source: "json_import",
    notes: "Interested in automated member notifications"
  }
];

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

  // Multi-Selection State
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Clipboard & Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // CSV Modal State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<string | null>(null);

  // JSON Modal State
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonUploading, setJsonUploading] = useState(false);
  const [jsonResult, setJsonResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showSchemaGuide, setShowSchemaGuide] = useState(false);

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3000);
  };

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

  // Clean lead for export
  const cleanLeadObject = (lead: Lead) => {
    const { _id, leadId, leadScore, scoreBreakdown, createdAt, ...rest } = lead;
    return {
      ...rest,
    };
  };

  // Copy single lead JSON
  const handleCopySingleLeadJson = async (lead: Lead, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cleanData = cleanLeadObject(lead);
    const jsonStr = JSON.stringify(cleanData, null, 2);
    try {
      await navigator.clipboard.writeText(jsonStr);
      setCopiedId(lead._id);
      showToast(`Copied JSON for "${lead.businessName}" to clipboard!`);
      setTimeout(() => {
        setCopiedId((prev) => (prev === lead._id ? null : prev));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy JSON:", err);
      showToast("Failed to copy JSON to clipboard");
    }
  };

  // Multi-select toggle
  const toggleSelectLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllPageSelected = useMemo(() => {
    if (leads.length === 0) return false;
    return leads.every((l) => selectedLeadIds.includes(l._id));
  }, [leads, selectedLeadIds]);

  const isSomePageSelected = useMemo(() => {
    if (leads.length === 0) return false;
    return leads.some((l) => selectedLeadIds.includes(l._id)) && !isAllPageSelected;
  }, [leads, selectedLeadIds, isAllPageSelected]);

  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const pageIds = new Set(leads.map((l) => l._id));
      setSelectedLeadIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = leads.map((l) => l._id);
      setSelectedLeadIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Copy selected leads JSON
  const handleCopySelectedLeadsJson = async () => {
    const selectedLeads = leads
      .filter((l) => selectedLeadIds.includes(l._id))
      .map(cleanLeadObject);

    if (selectedLeads.length === 0) return;

    const jsonStr = JSON.stringify(selectedLeads, null, 2);
    try {
      await navigator.clipboard.writeText(jsonStr);
      showToast(`Copied ${selectedLeads.length} lead(s) as JSON array to clipboard!`);
    } catch (err) {
      console.error("Failed to copy selected leads:", err);
      showToast("Failed to copy JSON to clipboard");
    }
  };

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
      showToast("Lead updated successfully!");
    } catch (err) {
      console.error("Failed to save lead:", err);
      showToast("Failed to save lead");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await leadsAPI.delete(deleteId);
      setSelectedLeadIds((prev) => prev.filter((id) => id !== deleteId));
      setDeleteId(null);
      loadLeads();
      showToast("Lead deleted successfully!");
    } catch (err) {
      console.error("Failed to delete lead:", err);
      showToast("Failed to delete lead");
    } finally {
      setDeleting(false);
    }
  };

  // Handle JSON Import
  const handleJsonImport = async () => {
    if (!jsonText.trim()) return;
    setJsonUploading(true);
    setJsonResult(null);

    try {
      let parsed: any;
      try {
        parsed = JSON.parse(jsonText.trim());
      } catch (parseErr: any) {
        setJsonResult({
          type: "error",
          message: `Invalid JSON syntax: ${parseErr.message}`,
        });
        setJsonUploading(false);
        return;
      }

      const leadsArray = Array.isArray(parsed) ? parsed : [parsed];

      if (leadsArray.length === 0) {
        setJsonResult({
          type: "error",
          message: "The provided JSON array is empty.",
        });
        setJsonUploading(false);
        return;
      }

      // Check required fields
      const missingNameIndex = leadsArray.findIndex(
        (item) => !item || typeof item !== "object" || !item.businessName || String(item.businessName).trim() === ""
      );

      if (missingNameIndex !== -1) {
        setJsonResult({
          type: "error",
          message: `Lead at index ${missingNameIndex + 1} is missing the required "businessName" field.`,
        });
        setJsonUploading(false);
        return;
      }

      const res = await leadsAPI.bulkUpload(leadsArray);
      const imported = res.data?.inserted ?? leadsArray.length;
      const errors = res.data?.errors ?? 0;

      setJsonResult({
        type: "success",
        message: `Successfully imported ${imported} lead(s)${errors > 0 ? ` (${errors} errors encountered)` : ""}.`,
      });

      showToast(`Imported ${imported} lead(s) successfully!`);
      setJsonText("");
      loadLeads();
    } catch (err: any) {
      setJsonResult({
        type: "error",
        message: err.response?.data?.message || err.message || "Failed to import leads",
      });
    } finally {
      setJsonUploading(false);
    }
  };

  // Format JSON in editor
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonText.trim());
      setJsonText(JSON.stringify(parsed, null, 2));
      setJsonResult(null);
    } catch (err: any) {
      setJsonResult({
        type: "error",
        message: `Cannot format invalid JSON: ${err.message}`,
      });
    }
  };

  // CSV Import
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
      showToast(`Imported ${imported} leads from CSV!`);
    } catch (err: any) {
      setCsvResult(`Error: ${err.response?.data?.message || "Import failed"}`);
    } finally {
      setCsvUploading(false);
    }
  };

  // Real-time JSON validation inspector
  const jsonInspector = useMemo<{
    valid: boolean;
    count: number;
    type?: "array" | "object";
    hasNames?: boolean;
    error?: string;
  } | null>(() => {
    if (!jsonText.trim()) return null;
    try {
      const parsed = JSON.parse(jsonText.trim());
      if (Array.isArray(parsed)) {
        return {
          valid: true,
          count: parsed.length,
          type: "array",
          hasNames: parsed.every((p) => p && typeof p === "object" && p.businessName),
        };
      } else if (parsed && typeof parsed === "object") {
        return {
          valid: true,
          count: 1,
          type: "object",
          hasNames: Boolean(parsed.businessName),
        };
      }
      return { valid: false, count: 0, error: "JSON root must be an object { } or an array [ ]" };
    } catch (err: any) {
      return { valid: false, count: 0, error: err.message };
    }
  }, [jsonText]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 mt-1">{totalCount} total leads</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* JSON Import Button */}
          <button
            onClick={() => {
              setShowJsonModal(true);
              setJsonResult(null);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all shadow-xs"
            title="Add or import leads using JSON format"
          >
            <FileJson className="w-4 h-4 text-blue-600" />
            <span>Import JSON</span>
          </button>

          {/* CSV Import Button */}
          <button
            onClick={() => setShowCsvModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
          >
            <Upload className="w-4 h-4 text-gray-500" />
            <span>Import CSV</span>
          </button>

          {/* Add Single Lead Button */}
          <button
            onClick={() => router.push("/leads/new")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
          >
            <span>+ Add Lead</span>
          </button>
        </div>
      </div>

      {/* Multi-Selection Sticky Banner */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-3.5 shadow-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="bg-white/20 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide">
              {selectedLeadIds.length} SELECTED
            </span>
            <span className="text-sm font-medium text-blue-50">
              {selectedLeadIds.length === 1
                ? "1 lead selected across pages"
                : `${selectedLeadIds.length} leads selected`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySelectedLeadsJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-xs"
              title="Copy selected leads as a JSON array"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Selected JSON ({selectedLeadIds.length})
            </button>
            <button
              onClick={() => setSelectedLeadIds([])}
              className="px-2.5 py-1.5 text-xs text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Search leads by name, email, phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={filterTemp}
            onChange={(e) => {
              setFilterTemp(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">All Temperatures</option>
            <option value="HOT">HOT</option>
            <option value="WARM">WARM</option>
            <option value="LOW">LOW</option>
            <option value="SKIP">SKIP</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
            onChange={(e) => {
              setFilterNiche(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Filter by city..."
            value={filterCity}
            onChange={(e) => {
              setFilterCity(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-gray-500">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading leads...</span>
            </div>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileJson className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-lg font-medium text-gray-700">No leads found</p>
            <p className="text-sm mt-1 text-gray-500">
              Try adjusting your filters, importing via JSON, or creating a new lead.
            </p>
            <button
              onClick={() => setShowJsonModal(true)}
              className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              + Add Lead via JSON
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {/* Select All Checkbox Column */}
                  <th className="w-10 px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAllPage}
                      className="text-gray-500 hover:text-blue-600 focus:outline-none"
                      title={isAllPageSelected ? "Deselect all on this page" : "Select all on this page"}
                    >
                      {isAllPageSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : isSomePageSelected ? (
                        <MinusSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th
                    onClick={() => handleSort("businessName")}
                    className="text-left px-4 py-3 cursor-pointer hover:text-gray-900 whitespace-nowrap"
                  >
                    Business Name<SortIcon field="businessName" />
                  </th>
                  <th
                    onClick={() => handleSort("niche")}
                    className="text-left px-4 py-3 cursor-pointer hover:text-gray-900 whitespace-nowrap"
                  >
                    Niche<SortIcon field="niche" />
                  </th>
                  <th
                    onClick={() => handleSort("city")}
                    className="text-left px-4 py-3 cursor-pointer hover:text-gray-900 whitespace-nowrap"
                  >
                    City<SortIcon field="city" />
                  </th>
                  <th className="text-left px-4 py-3 whitespace-nowrap">Website</th>
                  <th
                    onClick={() => handleSort("rating")}
                    className="text-left px-4 py-3 cursor-pointer hover:text-gray-900 whitespace-nowrap"
                  >
                    Rating<SortIcon field="rating" />
                  </th>
                  <th
                    onClick={() => handleSort("reviews")}
                    className="text-left px-4 py-3 cursor-pointer hover:text-gray-900 whitespace-nowrap"
                  >
                    Reviews<SortIcon field="reviews" />
                  </th>
                  <th
                    onClick={() => handleSort("leadScore")}
                    className="text-left px-4 py-3 cursor-pointer hover:text-gray-900 whitespace-nowrap"
                  >
                    Score<SortIcon field="leadScore" />
                  </th>
                  <th
                    onClick={() => handleSort("leadTemperature")}
                    className="text-left px-4 py-3 cursor-pointer hover:text-gray-900 whitespace-nowrap"
                  >
                    Temp<SortIcon field="leadTemperature" />
                  </th>
                  <th
                    onClick={() => handleSort("finalStatus")}
                    className="text-left px-4 py-3 cursor-pointer hover:text-gray-900 whitespace-nowrap"
                  >
                    Status<SortIcon field="finalStatus" />
                  </th>
                  <th className="text-center px-4 py-3 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead._id);
                  const isJustCopied = copiedId === lead._id;

                  return (
                    <tr
                      key={lead._id}
                      onClick={() => openEditModal(lead)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isSelected ? "bg-blue-50/70 hover:bg-blue-50" : "hover:bg-gray-50/80"
                      )}
                    >
                      {/* Row Checkbox */}
                      <td
                        className="px-3 py-3 text-center"
                        onClick={(e) => toggleSelectLead(lead._id, e)}
                      >
                        <button
                          type="button"
                          className="text-gray-400 hover:text-blue-600 focus:outline-none inline-flex items-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-300 hover:text-gray-500" />
                          )}
                        </button>
                      </td>

                      {/* Business Name */}
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {lead.businessName}
                          </p>
                          <p className="text-xs text-gray-500">{lead.leadId}</p>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.niche || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.city || "—"}</td>

                      {/* Website */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {lead.website ? (
                          <a
                            href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[140px] block"
                          >
                            {lead.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {lead.rating ? `${lead.rating} ★` : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{lead.reviews || "—"}</td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-gray-900">{lead.leadScore || 0}</span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-medium border",
                            getTemperatureColor(lead.leadTemperature)
                          )}
                        >
                          {lead.leadTemperature}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-medium capitalize",
                            getStatusColor(lead.finalStatus)
                          )}
                        >
                          {lead.finalStatus?.replace("_", " ")}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div
                          className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Copy JSON Button */}
                          <button
                            onClick={(e) => handleCopySingleLeadJson(lead, e)}
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
                              isJustCopied
                                ? "bg-emerald-100 text-emerald-700"
                                : "text-gray-600 hover:text-blue-700 hover:bg-blue-50"
                            )}
                            title="Copy this lead's JSON data to clipboard"
                          >
                            {isJustCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>JSON</span>
                              </>
                            )}
                          </button>

                          <div className="w-[1px] h-4 bg-gray-200" />

                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(lead)}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Lead"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteId(lead._id)}
                            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount} leads
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white bg-white text-gray-700 transition-colors shadow-2xs"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors shadow-2xs",
                      page === pageNum
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 hover:bg-white bg-white text-gray-700"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white bg-white text-gray-700 transition-colors shadow-2xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JSON IMPORT / ADD MODAL */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Add Leads via JSON</h2>
                  <p className="text-xs text-gray-500">
                    Paste a single JSON object <code className="text-blue-600">{"{ ... }"}</code> or an array of leads <code className="text-blue-600">{"[ { ... }, { ... } ]"}</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowJsonModal(false);
                  setJsonResult(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Quick Template Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 uppercase">Load Templates:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setJsonText(JSON.stringify(SINGLE_LEAD_EXAMPLE, null, 2));
                      setJsonResult(null);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 hover:text-blue-600 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-blue-500" />
                    1 Lead Template
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setJsonText(JSON.stringify(MULTIPLE_LEADS_EXAMPLE, null, 2));
                      setJsonResult(null);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 hover:text-blue-600 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    Multiple Leads Template
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFormatJson}
                    disabled={!jsonText.trim()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 transition-colors"
                  >
                    <Code2 className="w-3 h-3" />
                    Format JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setJsonText("");
                      setJsonResult(null);
                    }}
                    disabled={!jsonText.trim()}
                    className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-red-600 disabled:opacity-50 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* JSON Structure Guide Toggle */}
              <div className="border border-blue-100 bg-blue-50/50 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSchemaGuide(!showSchemaGuide)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-left text-xs font-semibold text-blue-900 hover:bg-blue-100/50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    JSON Structure & Supported Fields Guide
                  </span>
                  {showSchemaGuide ? (
                    <ChevronUp className="w-4 h-4 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-blue-600" />
                  )}
                </button>

                {showSchemaGuide && (
                  <div className="p-4 border-t border-blue-100 bg-white space-y-3 text-xs">
                    <p className="text-gray-600">
                      You can include any of the following fields in each lead object. Only <strong className="text-gray-900">businessName</strong> is strictly required:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
                      <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 space-y-1">
                        <p><strong className="text-blue-700">businessName*</strong> (string): Company or clinic name</p>
                        <p><strong className="text-gray-900">niche</strong> (string): e.g. &quot;Dentistry&quot;, &quot;Gym&quot;, &quot;Law&quot;</p>
                        <p><strong className="text-gray-900">city</strong> (string): e.g. &quot;New York, NY&quot;</p>
                        <p><strong className="text-gray-900">website</strong> (string): e.g. &quot;https://example.com&quot;</p>
                        <p><strong className="text-gray-900">email</strong> (string): e.g. &quot;contact@example.com&quot;</p>
                        <p><strong className="text-gray-900">phone</strong> (string): e.g. &quot;+1-555-0199&quot;</p>
                        <p><strong className="text-gray-900">googleMapsUrl</strong> (string): Maps URL or CID link</p>
                        <p><strong className="text-gray-900">rating</strong> (number): e.g. 4.8</p>
                        <p><strong className="text-gray-900">reviews</strong> (number): e.g. 150</p>
                      </div>
                      <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 space-y-1">
                        <p><strong className="text-gray-900">websiteStatus</strong>: &quot;excellent&quot; | &quot;good&quot; | &quot;poor&quot; | &quot;outdated&quot; | &quot;broken&quot; | &quot;none&quot;</p>
                        <p><strong className="text-gray-900">mobileStatus</strong>: &quot;excellent&quot; | &quot;good&quot; | &quot;poor&quot; | &quot;none&quot;</p>
                        <p><strong className="text-gray-900">bookingSystem</strong>: &quot;excellent&quot; | &quot;good&quot; | &quot;poor&quot; | &quot;none&quot;</p>
                        <p><strong className="text-gray-900">leadTemperature</strong>: &quot;HOT&quot; | &quot;WARM&quot; | &quot;LOW&quot; | &quot;SKIP&quot;</p>
                        <p><strong className="text-gray-900">finalStatus</strong>: &quot;new&quot; | &quot;contacted&quot; | &quot;qualified&quot; | &quot;won&quot; | ...</p>
                        <p><strong className="text-gray-900">dealValue</strong> (number): e.g. 2500</p>
                        <p><strong className="text-gray-900">mainProblem</strong> (string): Notes about website/booking issues</p>
                        <p><strong className="text-gray-900">notes</strong> (string): Internal notes</p>
                        <p><strong className="text-gray-900">source</strong> (string): e.g. &quot;json_import&quot;</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* JSON Textarea Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">
                    JSON Input:
                  </label>
                  {jsonInspector && (
                    <div className="text-xs">
                      {jsonInspector.valid ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Valid JSON — {jsonInspector.count} lead{jsonInspector.count > 1 ? "s" : ""} detected
                          {!jsonInspector.hasNames && " (⚠️ Missing businessName in some)"}
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          ⚠️ Invalid JSON
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <textarea
                  value={jsonText}
                  onChange={(e) => {
                    setJsonText(e.target.value);
                    if (jsonResult) setJsonResult(null);
                  }}
                  rows={13}
                  placeholder={`// Paste single lead object or array of leads:\n[\n  {\n    "businessName": "Acme Dental Clinic",\n    "niche": "Dentistry",\n    "city": "Austin, TX",\n    "email": "contact@acme.com",\n    "rating": 4.8\n  }\n]`}
                  className="w-full p-3.5 border border-gray-300 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-emerald-400 placeholder:text-gray-500 leading-relaxed resize-y"
                  spellCheck={false}
                />
              </div>

              {/* Result Message */}
              {jsonResult && (
                <div
                  className={cn(
                    "p-3.5 rounded-xl text-xs font-medium border flex items-start gap-2.5 animate-in fade-in duration-150",
                    jsonResult.type === "error"
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  )}
                >
                  {jsonResult.type === "error" ? (
                    <span className="text-base leading-none">⚠️</span>
                  ) : (
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">{jsonResult.message}</div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowJsonModal(false);
                  setJsonResult(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleJsonImport}
                disabled={jsonUploading || !jsonText.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors shadow-xs"
              >
                {jsonUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>
                      Import {jsonInspector?.valid && (jsonInspector?.count ?? 0) > 0 ? `${jsonInspector.count} Lead${(jsonInspector.count ?? 0) > 1 ? "s" : ""}` : "JSON"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Edit Lead: {selectedLead.businessName}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">{selectedLead.leadId}</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Copy JSON Button in Edit Modal */}
                <button
                  onClick={() => handleCopySingleLeadJson(selectedLead)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  title="Copy this lead's JSON data"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </button>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                >
                  ✕
                </button>
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
                  <input
                    type="text"
                    value={editForm.businessName || ""}
                    onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Niche</label>
                  <input
                    type="text"
                    value={editForm.niche || ""}
                    onChange={(e) => setEditForm({ ...editForm, niche: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editForm.city || ""}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={editForm.website || ""}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email || ""}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone || ""}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps URL</label>
                  <input
                    type="url"
                    value={editForm.googleMapsUrl || ""}
                    onChange={(e) => setEditForm({ ...editForm, googleMapsUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={editForm.rating || ""}
                    onChange={(e) => setEditForm({ ...editForm, rating: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reviews</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.reviews || ""}
                    onChange={(e) => setEditForm({ ...editForm, reviews: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website Status</label>
                  <select
                    value={editForm.websiteStatus || "none"}
                    onChange={(e) => setEditForm({ ...editForm, websiteStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
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
                  <select
                    value={editForm.mobileStatus || "none"}
                    onChange={(e) => setEditForm({ ...editForm, mobileStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="none">N/A</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Booking System</label>
                  <select
                    value={editForm.bookingSystem || "none"}
                    onChange={(e) => setEditForm({ ...editForm, bookingSystem: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="none">No Booking</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                  <select
                    value={editForm.leadTemperature || "LOW"}
                    onChange={(e) => setEditForm({ ...editForm, leadTemperature: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="HOT">HOT</option>
                    <option value="WARM">WARM</option>
                    <option value="LOW">LOW</option>
                    <option value="SKIP">SKIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.finalStatus || "new"}
                    onChange={(e) => setEditForm({ ...editForm, finalStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
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
                  <select
                    value={editForm.interested || "pending"}
                    onChange={(e) => setEditForm({ ...editForm, interested: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="maybe">Maybe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deal Value ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.dealValue || ""}
                    onChange={(e) => setEditForm({ ...editForm, dealValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Main Problem</label>
                  <input
                    type="text"
                    value={editForm.mainProblem || ""}
                    onChange={(e) => setEditForm({ ...editForm, mainProblem: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <input
                    type="text"
                    value={editForm.source || ""}
                    onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={editForm.notes || ""}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLead}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Lead</h2>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete this lead? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Import CSV</h2>
                <button
                  onClick={() => {
                    setShowCsvModal(false);
                    setCsvText("");
                    setCsvResult(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Paste CSV data below. First row should be headers.</p>
              <p className="text-xs text-gray-400">
                Columns: business name, niche, city, website, email, phone, rating, reviews, website status, mobile status, booking system, google maps url, notes, source
              </p>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={12}
                placeholder={"business name, niche, city, website, email, phone, rating, reviews\nAcme Corp, Dentistry, New York, acme.com, info@acme.com, 555-0123, 4.5, 320\nAnother Co, Restaurant, Boston, , hello@another.com, 555-0456, 4.2, 150"}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {csvResult && (
                <div
                  className={cn(
                    "p-3 rounded-lg text-sm",
                    csvResult.startsWith("Error")
                      ? "bg-red-50 border border-red-200 text-red-700"
                      : "bg-green-50 border border-green-200 text-green-700"
                  )}
                >
                  {csvResult}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCsvModal(false);
                  setCsvText("");
                  setCsvResult(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCsvImport}
                disabled={csvUploading || !csvText.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                {csvUploading ? "Importing..." : "Import Leads"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-sm animate-in fade-in slide-in-from-bottom-3 duration-200 border border-gray-800">
          <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded-full">
            <Check className="w-4 h-4" />
          </div>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
