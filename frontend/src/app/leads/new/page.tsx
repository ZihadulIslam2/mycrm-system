"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { leadsAPI } from "@/lib/api";

export default function NewLeadPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    businessName: "",
    niche: "",
    city: "",
    website: "",
    email: "",
    phone: "",
    googleMapsUrl: "",
    source: "manual",
    rating: "",
    reviews: "",
    websiteStatus: "none",
    mobileStatus: "none",
    bookingSystem: "none",
    mainProblem: "",
    notes: "",
  });

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = {
        ...form,
        rating: form.rating ? parseFloat(form.rating) : 0,
        reviews: form.reviews ? parseInt(form.reviews) : 0,
      };
      await leadsAPI.create(payload);
      router.push("/leads");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Lead</h1>
        <p className="text-gray-500 mt-1">Manually add a new lead to your pipeline</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name <span className="text-red-500">*</span></label>
              <input type="text" required value={form.businessName} onChange={(e) => updateField("businessName", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Dental Clinic XYZ" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Niche / Industry</label>
              <input type="text" value={form.niche} onChange={(e) => updateField("niche", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Dentistry" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={form.city} onChange={(e) => updateField("city", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="New York" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input type="url" value={form.website} onChange={(e) => updateField("website", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps URL</label>
              <input type="url" value={form.googleMapsUrl} onChange={(e) => updateField("googleMapsUrl", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://maps.google.com/..." />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="contact@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+1 (555) 000-0000" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating (0-5)</label>
              <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => updateField("rating", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="4.5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reviews</label>
              <input type="number" min="0" value={form.reviews} onChange={(e) => updateField("reviews", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="320" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website Status</label>
              <select value={form.websiteStatus} onChange={(e) => updateField("websiteStatus", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="none">No Website</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="poor">Poor</option>
                <option value="outdated">Outdated</option>
                <option value="broken">Broken</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Experience</label>
              <select value={form.mobileStatus} onChange={(e) => updateField("mobileStatus", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="none">N/A</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Booking System</label>
              <select value={form.bookingSystem} onChange={(e) => updateField("bookingSystem", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="none">No Booking System</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <input type="text" value={form.source} onChange={(e) => updateField("source", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="google_maps" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Main Problem</label>
              <input type="text" value={form.mainProblem} onChange={(e) => updateField("mainProblem", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Terrible website, no booking system" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Any additional notes about this lead..." />
        </div>

        <div className="flex justify-end gap-3 pb-6">
          <button type="button" onClick={() => router.push("/leads")} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
            {saving ? "Creating..." : "Create Lead"}
          </button>
        </div>
      </form>
    </div>
  );
}
