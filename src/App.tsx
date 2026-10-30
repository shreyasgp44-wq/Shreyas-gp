import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/Navbar.tsx';
import { HackathonTourBar } from './components/HackathonTourBar.tsx';
import { CitizenPortal } from './components/CitizenPortal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { HotspotMapView } from './components/HotspotMapView.tsx';
import { DuplicateDetectionCenter } from './components/DuplicateDetectionCenter.tsx';
import { ActionBriefHub } from './components/ActionBriefHub.tsx';
import { ActionBriefModal } from './components/ActionBriefModal.tsx';
import { Complaint, DashboardStats, Hotspot, DuplicateCluster } from './types/index.ts';
import { fetchComplaints, fetchDashboardStats, fetchStatus, resetDemoData } from './api.ts';
import { Landmark, Shield, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('citizen-portal');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [duplicateClusters, setDuplicateClusters] = useState<DuplicateCluster[]>([]);
  const [geminiLive, setGeminiLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Modal inspection
  const [inspectedComplaint, setInspectedComplaint] = useState<Complaint | null>(null);

  // Quick report prefill from Hackathon bar
  const [presetSample, setPresetSample] = useState<{
    title: string;
    description: string;
    category: string;
    area: string;
    address: string;
  } | null>(null);

  // Quick tracking id jump
  const [initialTrackingId, setInitialTrackingId] = useState<string | undefined>(undefined);

  const loadAllData = useCallback(async () => {
    try {
      const [statusRes, compList, statsRes] = await Promise.all([
        fetchStatus().catch(() => ({ geminiLive: false, totalComplaints: 0, status: 'ok', model: '' })),
        fetchComplaints().catch(() => []),
        fetchDashboardStats().catch(() => null),
      ]);

      setGeminiLive(statusRes.geminiLive);
      setComplaints(compList);
      if (statsRes) {
        setStats(statsRes.stats);
        setHotspots(statsRes.hotspots);
        setDuplicateClusters(statsRes.duplicateClusters);
      }
    } catch (err) {
      console.error('Failed to load initial CivicAI data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleResetDemo = async () => {
    try {
      await resetDemoData();
      await loadAllData();
      setResetMessage('Reset database to clean 36 synthetic hackathon complaints.');
      setTimeout(() => setResetMessage(null), 3500);
    } catch (err) {
      console.error('Failed to reset demo data:', err);
    }
  };

  const handleSelectComplaintById = (complaintId: string) => {
    const found = complaints.find((c) => c.id.toUpperCase() === complaintId.toUpperCase());
    if (found) {
      setInspectedComplaint(found);
    }
  };

  const handleOpenReportWithSample = (sample: {
    title: string;
    description: string;
    category: string;
    area: string;
    address: string;
  }) => {
    setPresetSample(sample);
    setActiveTab('citizen-portal');
  };

  const handleComplaintCreated = (newComplaint: Complaint) => {
    setComplaints((prev) => [newComplaint, ...prev]);
    loadAllData();
  };

  const handleComplaintUpdated = (updated: Complaint) => {
    setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setInspectedComplaint(updated);
    loadAllData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-slate-800">Booting CivicAI Intelligence Platform...</h2>
          <p className="text-xs text-slate-500">Connecting municipal database and Google Gemini 3.8 Flash</p>
        </div>
      </div>
    );
  }

  const calculatedStats: DashboardStats = stats || {
    total: complaints.length,
    pending: complaints.filter((c) => c.status !== 'Resolved').length,
    resolved: complaints.filter((c) => c.status === 'Resolved').length,
    highPriority: complaints.filter((c) => c.priority === 'Critical' || c.priority === 'High').length,
    underReview: complaints.filter((c) => c.status === 'Under Review').length,
    inProgress: complaints.filter((c) => c.status === 'In Progress').length,
    assigned: complaints.filter((c) => c.status === 'Assigned').length,
    duplicatesDetected: complaints.filter((c) => c.isDuplicate).length,
    avgResolutionHours: 4.8,
    byCategory: {
      Roads: complaints.filter((c) => c.category === 'Roads').length,
      Water: complaints.filter((c) => c.category === 'Water').length,
      Waste: complaints.filter((c) => c.category === 'Waste').length,
      Electricity: complaints.filter((c) => c.category === 'Electricity').length,
      Drainage: complaints.filter((c) => c.category === 'Drainage').length,
      'Public Safety': complaints.filter((c) => c.category === 'Public Safety').length,
    },
    byPriority: {
      Critical: complaints.filter((c) => c.priority === 'Critical').length,
      High: complaints.filter((c) => c.priority === 'High').length,
      Medium: complaints.filter((c) => c.priority === 'Medium').length,
      Low: complaints.filter((c) => c.priority === 'Low').length,
    },
    byArea: {},
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        geminiLive={geminiLive}
        onResetDemo={handleResetDemo}
        onOpenQuickReport={() => {
          setPresetSample(null);
          setActiveTab('citizen-portal');
        }}
      />

      {/* Presentation Fast-Track Bar */}
      <HackathonTourBar
        complaints={complaints}
        onSelectComplaint={handleSelectComplaintById}
        onOpenReportWithSample={handleOpenReportWithSample}
      />

      {/* Reset Confirmation Banner */}
      {resetMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* Main View Port */}
      <main className="flex-1">
        {activeTab === 'citizen-portal' && (
          <CitizenPortal
            complaints={complaints}
            onComplaintCreated={handleComplaintCreated}
            onSelectComplaintForDetail={setInspectedComplaint}
            initialTrackingId={initialTrackingId}
            presetSample={presetSample}
            onClearPresetSample={() => setPresetSample(null)}
          />
        )}

        {activeTab === 'admin-dashboard' && (
          <AdminDashboard
            complaints={complaints}
            stats={calculatedStats}
            onRefreshData={loadAllData}
            onSelectComplaint={setInspectedComplaint}
          />
        )}

        {activeTab === 'hotspot-map' && (
          <HotspotMapView
            complaints={complaints}
            hotspots={hotspots}
            onSelectComplaint={setInspectedComplaint}
          />
        )}

        {activeTab === 'duplicates' && (
          <DuplicateDetectionCenter
            duplicateClusters={duplicateClusters}
            allComplaints={complaints}
            onRefreshData={loadAllData}
            onSelectComplaint={setInspectedComplaint}
          />
        )}

        {activeTab === 'action-briefs' && (
          <ActionBriefHub
            complaints={complaints}
            onSelectComplaint={setInspectedComplaint}
            onRefreshData={loadAllData}
          />
        )}
      </main>

      {/* Inspection and Action Brief Modal */}
      {inspectedComplaint && (
        <ActionBriefModal
          complaint={inspectedComplaint}
          onClose={() => setInspectedComplaint(null)}
          onComplaintUpdated={handleComplaintUpdated}
        />
      )}

      {/* Civic Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
              C
            </div>
            <span className="font-semibold text-slate-900">CivicAI – From Complaints to Action</span>
            <span>·</span>
            <span>College Hackathon Prototype</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <span>Powered by Google Gemini 3.8 Flash</span>
            <span>·</span>
            <span>Full-Stack Persistent Architecture</span>
            <span>·</span>
            <button
              onClick={handleResetDemo}
              className="text-blue-700 hover:underline font-semibold"
            >
              Reset 36 Demo Records
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
