import React from 'react';
import { Landmark, FileText, LayoutDashboard, MapPin, CopyCheck, Wrench, Sparkles, RefreshCw } from 'lucide-react';

export type ActiveTab = 'citizen-portal' | 'admin-dashboard' | 'hotspot-map' | 'duplicates' | 'action-briefs';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  geminiLive: boolean;
  onResetDemo: () => void;
  onOpenQuickReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  geminiLive,
  onResetDemo,
  onOpenQuickReport,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar Contract: Zone 1, Zone 2, Zone 3 */}
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-sm">
              <Landmark className="w-5 h-5" />
            </div>
            <button
              onClick={() => onTabChange('citizen-portal')}
              className="text-left font-bold text-xl tracking-tight text-slate-900 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              CivicAI
            </button>
            <span className="hidden sm:inline text-xs text-slate-400 font-normal">|</span>
            <span className="hidden sm:inline text-xs font-medium text-slate-600 tracking-wide uppercase">
              From Complaints to Action
            </span>
          </div>

          {/* Zone 2: 4-5 clean single-line navigation links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <button
              onClick={() => onTabChange('citizen-portal')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'citizen-portal'
                  ? 'text-blue-700 bg-blue-50/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Citizen Portal</span>
            </button>

            <button
              onClick={() => onTabChange('admin-dashboard')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'admin-dashboard'
                  ? 'text-blue-700 bg-blue-50/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Admin Operations</span>
            </button>

            <button
              onClick={() => onTabChange('hotspot-map')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'hotspot-map'
                  ? 'text-blue-700 bg-blue-50/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Hotspot Map</span>
            </button>

            <button
              onClick={() => onTabChange('duplicates')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'duplicates'
                  ? 'text-blue-700 bg-blue-50/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <CopyCheck className="w-4 h-4" />
              <span>Duplicate Triage</span>
            </button>

            <button
              onClick={() => onTabChange('action-briefs')}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'action-briefs'
                  ? 'text-blue-700 bg-blue-50/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Action Briefs</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenQuickReport}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>File Complaint</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden items-center justify-between border-t border-slate-100 py-2 overflow-x-auto text-xs gap-1">
          <button
            onClick={() => onTabChange('citizen-portal')}
            className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap ${
              activeTab === 'citizen-portal' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
            }`}
          >
            Citizen
          </button>
          <button
            onClick={() => onTabChange('admin-dashboard')}
            className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap ${
              activeTab === 'admin-dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => onTabChange('hotspot-map')}
            className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap ${
              activeTab === 'hotspot-map' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
            }`}
          >
            Hotspots
          </button>
          <button
            onClick={() => onTabChange('duplicates')}
            className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap ${
              activeTab === 'duplicates' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
            }`}
          >
            Duplicates
          </button>
          <button
            onClick={() => onTabChange('action-briefs')}
            className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap ${
              activeTab === 'action-briefs' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'
            }`}
          >
            Action Briefs
          </button>
        </div>
      </div>

      {/* Presentation Sub-Bar (Discreet & Functional) */}
      <div className="bg-slate-50 border-t border-slate-200/80 px-4 py-1.5 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Hackathon Demo Mode</span>
            <span aria-hidden="true">·</span>
            <span>36 Synthetic Complaints Seeded</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>AI Engine: {geminiLive ? 'Google Gemini 3.8 Flash (Active)' : 'CivicAI Heuristic Fallback'}</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onResetDemo}
              className="text-slate-600 hover:text-blue-700 flex items-center gap-1 font-medium hover:underline transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset 36 Demo Records</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
