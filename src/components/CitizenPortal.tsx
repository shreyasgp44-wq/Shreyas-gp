import React, { useState } from 'react';
import {
  FileText,
  Search,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  ThumbsUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  Info,
  Calendar,
  Building2,
  Camera,
  X,
} from 'lucide-react';
import { Category, Complaint, ComplaintStatus } from '../types/index.ts';
import { createComplaint, upvoteComplaint } from '../api.ts';

interface CitizenPortalProps {
  complaints: Complaint[];
  onComplaintCreated: (newComplaint: Complaint) => void;
  onSelectComplaintForDetail: (complaint: Complaint) => void;
  initialTrackingId?: string;
  presetSample?: {
    title: string;
    description: string;
    category: string;
    area: string;
    address: string;
  } | null;
  onClearPresetSample?: () => void;
}

const CATEGORIES: Category[] = [
  'Roads',
  'Water',
  'Waste',
  'Electricity',
  'Drainage',
  'Public Safety',
];

const AREAS = [
  'Indiranagar',
  'Koramangala',
  'Whitefield',
  'Jayanagar',
  'Malleshwaram',
  'MG Road Hub',
  'HSR Layout',
  'Hebbal',
];

const SAMPLE_PHOTOS = [
  { label: 'Pothole Road', url: '/src/assets/images/pothole_road_1793342885294.jpg' },
  { label: 'Overflowing Waste', url: '/src/assets/images/overflowing_waste_1793342885872.jpg' },
  { label: 'Waterlogged Street', url: '/src/assets/images/waterlogged_street_1793342886838.jpg' },
  { label: 'Damaged Streetlight', url: '/src/assets/images/broken_streetlight_1793342887075.jpg' },
];

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  complaints,
  onComplaintCreated,
  onSelectComplaintForDetail,
  initialTrackingId,
  presetSample,
  onClearPresetSample,
}) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'track' | 'feed'>(
    initialTrackingId ? 'track' : 'submit'
  );

  // Form states
  const [title, setTitle] = useState(presetSample?.title || '');
  const [description, setDescription] = useState(presetSample?.description || '');
  const [category, setCategory] = useState<string>(presetSample?.category || 'Auto-detect');
  const [area, setArea] = useState<string>(presetSample?.area || 'Indiranagar');
  const [address, setAddress] = useState(presetSample?.address || '');
  const [imageUrl, setImageUrl] = useState<string>('/src/assets/images/pothole_road_1793342885294.jpg');
  const [citizenName, setCitizenName] = useState('Rahul K.');
  const [citizenPhone, setCitizenPhone] = useState('+91 98450 12345');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Tracking states
  const [searchQuery, setSearchQuery] = useState(initialTrackingId || '');
  const [searchedComplaint, setSearchedComplaint] = useState<Complaint | null>(
    initialTrackingId
      ? complaints.find((c) => c.id.toUpperCase() === initialTrackingId.toUpperCase()) || null
      : complaints[0] || null
  );

  // Community feed filter
  const [feedArea, setFeedArea] = useState('All');
  const [feedCategory, setFeedCategory] = useState('All');

  // Handle Preset Sample updates
  React.useEffect(() => {
    if (presetSample) {
      setTitle(presetSample.title);
      setDescription(presetSample.description);
      setCategory(presetSample.category || 'Auto-detect');
      setArea(presetSample.area || 'Koramangala');
      setAddress(presetSample.address || '');
      setActiveTab('submit');
      if (onClearPresetSample) onClearPresetSample();
    }
  }, [presetSample]);

  // Handle Initial Tracking ID or default first complaint updates
  React.useEffect(() => {
    if (initialTrackingId) {
      setSearchQuery(initialTrackingId);
      const found = complaints.find((c) => c.id.toUpperCase() === initialTrackingId.toUpperCase());
      if (found) {
        setSearchedComplaint(found);
        setActiveTab('track');
      }
    } else if (!searchedComplaint && complaints.length > 0) {
      setSearchedComplaint(complaints[0]);
    }
  }, [initialTrackingId, complaints, searchedComplaint]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !area) {
      setSubmitError('Please complete the title, description, and municipal area.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const newRecord = await createComplaint({
        title,
        description,
        category: category === 'Auto-detect' ? undefined : category,
        area,
        address,
        imageUrl,
        citizenName,
        citizenPhone,
      });

      onComplaintCreated(newRecord);
      setCreatedComplaint(newRecord);
      setSearchedComplaint(newRecord);
      setSearchQuery(newRecord.id);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit complaint. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSearchTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toUpperCase();
    if (!query) return;

    const found = complaints.find(
      (c) =>
        c.id.toUpperCase() === query ||
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        (c.citizenPhone && c.citizenPhone.includes(query))
    );

    if (found) {
      setSearchedComplaint(found);
    } else {
      setSearchedComplaint(null);
    }
  };

  const handleUpvote = async (id: string) => {
    try {
      const res = await upvoteComplaint(id);
      if (searchedComplaint && searchedComplaint.id === id) {
        setSearchedComplaint({
          ...searchedComplaint,
          citizenUpvotes: res.upvotes,
        });
      }
    } catch (err) {
      console.error('Failed to upvote:', err);
    }
  };

  const filteredFeed = complaints.filter((c) => {
    if (feedArea !== 'All' && c.area !== feedArea) return false;
    if (feedCategory !== 'All' && c.category !== feedCategory) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Sub-header navigation tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Citizen Action Portal
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Report local public hazards, receive transparent AI triage, and track municipal resolution in real-time.
          </p>
        </div>

        {/* Segmented Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'submit'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Report Issue
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'track'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Track Complaint
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'feed'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Community Feed ({complaints.length})
          </button>
        </div>
      </div>

      {/* TAB 1: SUBMIT COMPLAINT */}
      {activeTab === 'submit' && (
        <div className="mt-8 max-w-4xl mx-auto">
          {createdComplaint ? (
            /* Success confirmation card */
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Grievance Registered Successfully
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    Your Complaint ID: <span className="font-mono tabular-nums text-blue-700">{createdComplaint.id}</span>
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    A municipal ticket has been generated and dispatched to the{' '}
                    <strong className="text-slate-800">{createdComplaint.department}</strong>.
                  </p>

                  {/* Immediate AI Triage Report */}
                  <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                      <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
                        <Sparkles className="w-4 h-4" />
                        <span>AI Triage Summary ({createdComplaint.aiModelUsed || 'Gemini 3.8 Flash'})</span>
                      </div>
                      <div className="text-slate-500 font-mono">
                        Priority Score: <strong className="text-slate-900">{createdComplaint.priorityScore}/100</strong> ({createdComplaint.priority})
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-slate-800">
                      <p className="font-medium">{createdComplaint.aiSummary}</p>
                      <p className="text-xs text-slate-600 mt-1.5">
                        <span className="font-semibold text-slate-700">Assessment:</span> {createdComplaint.priorityExplanation}
                      </p>
                    </div>

                    {createdComplaint.isDuplicate && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold">Duplicate Cluster Detected:</strong> Matched existing ticket{' '}
                          <span className="font-mono">{createdComplaint.duplicateOfId}</span> ({createdComplaint.duplicateConfidence}% similarity). Both reports will be solved under the same municipal crew dispatch.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleCopyId(createdComplaint.id)}
                      className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedId ? 'Copied to Clipboard' : 'Copy Complaint ID'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('track');
                        setSearchedComplaint(createdComplaint);
                        setSearchQuery(createdComplaint.id);
                      }}
                      className="px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <span>Track Status Online</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setCreatedComplaint(null);
                        setTitle('');
                        setDescription('');
                        setAddress('');
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors ml-auto"
                    >
                      File Another Complaint
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Complaint Submission Form */
            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
              <div className="space-y-6">
                {/* Error Banner */}
                {submitError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Complaint Title */}
                <div>
                  <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Complaint Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Deep dangerous pothole opposite Metro Pillar 42 on 100ft road"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Problem Description <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs text-slate-400">Be as specific as possible for AI triage</span>
                  </div>
                  <textarea
                    id="description"
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain the civic issue: size, hazard risk to pedestrians or vehicles, how long it has persisted, and any nearby landmarks..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all resize-y"
                  />
                </div>

                {/* Category & Municipal Area */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    >
                      <option value="Auto-detect">✨ AI Auto-Detect (Recommended)</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Our Gemini AI model automatically classifies and routes the issue.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="area" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Municipal Ward / Area <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="area"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    >
                      {AREAS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Determines local zonal engineer jurisdiction.
                    </p>
                  </div>
                </div>

                {/* Specific Address / Landmark */}
                <div>
                  <label htmlFor="address" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Street Address & Landmarks
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g., Near 12th Main Junction, Opposite SBI Bank, Indiranagar"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  />
                </div>

                {/* Photo Evidence Upload */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Photographic Evidence
                  </label>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center gap-2">
                        <Upload className="w-4 h-4 text-slate-500" />
                        <span>Upload From Device</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      <div className="text-xs text-slate-500">
                        Or select one of our authentic test photos:
                      </div>
                    </div>

                    {/* Quick Sample Photos */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SAMPLE_PHOTOS.map((p) => (
                        <button
                          key={p.url}
                          type="button"
                          onClick={() => setImageUrl(p.url)}
                          className={`relative rounded-lg overflow-hidden border text-left transition-all ${
                            imageUrl === p.url
                              ? 'border-blue-600 ring-2 ring-blue-600/30'
                              : 'border-slate-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={p.url}
                            alt={p.label}
                            referrerPolicy="no-referrer"
                            className="w-full h-16 object-cover"
                          />
                          <div className="p-1 bg-white text-[11px] font-medium text-slate-700 truncate">
                            {p.label}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Current Preview */}
                    {imageUrl && (
                      <div className="relative inline-block border border-slate-200 rounded-lg overflow-hidden mt-1">
                        <img
                          src={imageUrl}
                          alt="Complaint preview"
                          referrerPolicy="no-referrer"
                          className="h-32 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full"
                          title="Remove image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Citizen Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label htmlFor="citizenName" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Citizen Name
                    </label>
                    <input
                      id="citizenName"
                      type="text"
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="citizenPhone" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Contact Phone (for SMS updates)
                    </label>
                    <input
                      id="citizenPhone"
                      type="text"
                      value={citizenPhone}
                      onChange={(e) => setCitizenPhone(e.target.value)}
                      placeholder="+91 98450 00000"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verified citizen dispatch via municipal SLA</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>AI Analyzing & Routing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Submit & Analyze Complaint</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: TRACK COMPLAINT */}
      {activeTab === 'track' && (
        <div className="mt-8 max-w-4xl mx-auto space-y-6">
          {/* Tracking Search Input */}
          <form onSubmit={handleSearchTrack} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Complaint ID (e.g. CIVIC-2026-1001) or mobile number..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap"
              >
                Track Status
              </button>
            </div>

            {/* Quick Demo ID pills */}
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 overflow-x-auto pb-1">
              <span>Quick demo tickets:</span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('CIVIC-2026-1001');
                  const f = complaints.find((c) => c.id === 'CIVIC-2026-1001');
                  if (f) setSearchedComplaint(f);
                }}
                className="font-mono text-blue-700 hover:underline"
              >
                CIVIC-2026-1001
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('CIVIC-2026-1004');
                  const f = complaints.find((c) => c.id === 'CIVIC-2026-1004');
                  if (f) setSearchedComplaint(f);
                }}
                className="font-mono text-blue-700 hover:underline"
              >
                CIVIC-2026-1004
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('CIVIC-2026-1008');
                  const f = complaints.find((c) => c.id === 'CIVIC-2026-1008');
                  if (f) setSearchedComplaint(f);
                }}
                className="font-mono text-blue-700 hover:underline"
              >
                CIVIC-2026-1008
              </button>
            </div>
          </form>

          {/* Searched Complaint Display */}
          {searchedComplaint ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Header and Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="font-mono font-semibold text-blue-700 tabular-nums">
                      {searchedComplaint.id}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{searchedComplaint.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{searchedComplaint.area}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{searchedComplaint.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpvote(searchedComplaint.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-blue-700" />
                    <span>Upvote ({searchedComplaint.citizenUpvotes || 1})</span>
                  </button>
                </div>
              </div>

              {/* Step-by-Step Status Timeline Stepper */}
              <div className="py-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
                  Municipal Resolution Progress
                </span>

                {(() => {
                  const stages: ComplaintStatus[] = [
                    'Submitted',
                    'Under Review',
                    'Assigned',
                    'In Progress',
                    'Resolved',
                  ];
                  const currentIdx = stages.indexOf(searchedComplaint.status);

                  return (
                    <div className="relative">
                      {/* Connecting Line */}
                      <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
                      <div
                        className="hidden sm:block absolute top-1/2 left-0 h-0.5 bg-blue-700 -translate-y-1/2 z-0 transition-all duration-500"
                        style={{
                          width: `${(Math.max(0, currentIdx) / (stages.length - 1)) * 100}%`,
                        }}
                      />

                      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {stages.map((st, i) => {
                          const isDone = i <= currentIdx;
                          const isCurrent = i === currentIdx;

                          return (
                            <div
                              key={st}
                              className={`p-2.5 rounded-lg border text-center transition-all ${
                                isCurrent
                                  ? 'bg-blue-50 border-blue-600 text-blue-900 font-semibold shadow-sm'
                                  : isDone
                                  ? 'bg-white border-slate-300 text-slate-800'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                            >
                              <div
                                className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-xs mb-1.5 ${
                                  isCurrent
                                    ? 'bg-blue-700 text-white'
                                    : isDone
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
                              </div>
                              <div className="text-xs">{st}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Details Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                {/* Left: Complaint description & AI Triage */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Citizen Description
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                      {searchedComplaint.description}
                    </p>
                  </div>

                  {/* AI Triage Card */}
                  <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-200/80">
                    <div className="flex items-center justify-between text-xs font-semibold text-blue-800 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-blue-700" />
                        AI Analysis ({searchedComplaint.aiModelUsed || 'Gemini 3.8 Flash'})
                      </span>
                      <span className="font-mono tabular-nums">
                        Priority: {searchedComplaint.priorityScore}/100 ({searchedComplaint.priority})
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 font-medium">{searchedComplaint.aiSummary}</p>
                    <p className="text-xs text-slate-600 mt-2">
                      <strong className="text-slate-800">Priority Rationale:</strong>{' '}
                      {searchedComplaint.priorityExplanation}
                    </p>

                    <div className="mt-3 flex items-center gap-4 text-xs font-mono text-slate-600 pt-2 border-t border-blue-200/50">
                      <span>Urgency: <strong className="text-slate-900">{searchedComplaint.urgencyScore}/10</strong></span>
                      <span>·</span>
                      <span>Public Impact: <strong className="text-slate-900">{searchedComplaint.publicImpactScore}/10</strong></span>
                    </div>
                  </div>

                  {/* Duplicate notice if applicable */}
                  {searchedComplaint.isDuplicate && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Duplicate incident:</strong> Linked to primary ticket{' '}
                        <button
                          onClick={() => {
                            const p = complaints.find((c) => c.id === searchedComplaint.duplicateOfId);
                            if (p) setSearchedComplaint(p);
                          }}
                          className="font-mono underline font-bold"
                        >
                          {searchedComplaint.duplicateOfId}
                        </button>
                        . Reason: {searchedComplaint.duplicateReason}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Department, Location & Image */}
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Assigned Department</span>
                      <span className="font-semibold text-slate-900">{searchedComplaint.department}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Location</span>
                      <span className="font-semibold text-slate-900">{searchedComplaint.area}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Street Address</span>
                      <span className="text-slate-800 text-right max-w-[200px] truncate">{searchedComplaint.address}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Reported By</span>
                      <span className="font-semibold text-slate-900">{searchedComplaint.citizenName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Date Filed</span>
                      <span className="font-mono text-slate-700">
                        {new Date(searchedComplaint.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>

                  {/* Photo attachment if available */}
                  {searchedComplaint.imageUrl && (
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Site Photograph
                      </span>
                      <img
                        src={searchedComplaint.imageUrl}
                        alt={searchedComplaint.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-44 object-cover rounded-lg border border-slate-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamped Audit Timeline */}
              <div className="pt-4 border-t border-slate-200">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Official Activity Timeline
                </span>
                <div className="space-y-3">
                  {searchedComplaint.timeline.map((evt, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-blue-700 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{evt.actor}</span>
                          <span className="text-slate-400">·</span>
                          <span className="font-mono text-slate-500">
                            {new Date(evt.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-slate-700 mt-0.5">{evt.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-xl">
              <p className="text-sm text-slate-600">
                No complaint matching &quot;{searchQuery}&quot; found. Please check your Complaint ID.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMMUNITY CIVIC FEED */}
      {activeTab === 'feed' && (
        <div className="mt-8 space-y-6">
          {/* Feed Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Ward Area</label>
                <select
                  value={feedArea}
                  onChange={(e) => setFeedArea(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900"
                >
                  <option value="All">All Areas</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Category</label>
                <select
                  value={feedCategory}
                  onChange={(e) => setFeedCategory(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Showing <strong className="text-slate-900">{filteredFeed.length}</strong> community reports
            </div>
          </div>

          {/* Feed Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFeed.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-mono font-semibold text-blue-700">{item.id}</span>
                    <span className="font-medium text-slate-700">{item.status}</span>
                  </div>

                  <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 mt-1">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 mt-2">
                    {item.aiSummary || item.description}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-medium text-slate-700">{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.area}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">Priority: {item.priorityScore}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleUpvote(item.id)}
                    className="flex items-center gap-1 text-xs text-slate-600 hover:text-blue-700 transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{item.citizenUpvotes || 1} Support</span>
                  </button>

                  <button
                    onClick={() => {
                      setSearchedComplaint(item);
                      setSearchQuery(item.id);
                      setActiveTab('track');
                    }}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Track Issue →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
