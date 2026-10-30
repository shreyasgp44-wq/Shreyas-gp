import React, { useState } from 'react';
import {
  Wrench,
  Clock,
  Sparkles,
  HardHat,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Building2,
  FileCheck2,
} from 'lucide-react';
import { Complaint, Department, Priority } from '../types/index.ts';
import { generateActionBrief } from '../api.ts';

interface ActionBriefHubProps {
  complaints: Complaint[];
  onSelectComplaint: (complaint: Complaint) => void;
  onRefreshData: () => void;
}

const DEPARTMENTS: Department[] = [
  'Roads & Infrastructure',
  'Water Supply & Sewerage',
  'Solid Waste Management',
  'Electricity & Energy Board',
  'Stormwater & Drainage',
  'Public Safety & Vigilance',
];

export const ActionBriefHub: React.FC<ActionBriefHubProps> = ({
  complaints,
  onSelectComplaint,
  onRefreshData,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const filtered = complaints.filter((c) => {
    if (selectedDept !== 'All' && c.department !== selectedDept) return false;
    if (selectedPriority !== 'All' && c.priority !== selectedPriority) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q) ||
        (c.actionBrief && c.actionBrief.dispatchCode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleGenerateBrief = async (complaintId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGeneratingId(complaintId);
    try {
      await generateActionBrief(complaintId);
      onRefreshData();
    } catch (err) {
      console.error('Failed to generate action brief:', err);
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <Wrench className="w-4 h-4 text-blue-600" />
            <span>Operational Dispatch Wing</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Municipal Action Briefs & Work Orders
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            AI-synthesized tactical work orders, equipment manifests, and safety guidelines for field engineering teams.
          </p>
        </div>

        <button
          onClick={onRefreshData}
          className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Work Orders</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search work code, issue title, ward..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Grid of Action Brief Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((item) => {
          const brief = item.actionBrief;

          return (
            <div
              key={item.id}
              onClick={() => onSelectComplaint(item)}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700">{item.id}</span>
                    <span>·</span>
                    <span className="font-semibold text-slate-800">{item.department}</span>
                  </div>
                  <span
                    className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                      item.priority === 'Critical'
                        ? 'bg-rose-50 text-rose-700'
                        : item.priority === 'High'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {item.priorityScore}/100 ({item.priority})
                  </span>
                </div>

                {/* Complaint Title */}
                <h3 className="text-sm font-bold text-slate-900 mt-2.5 line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                  {item.aiSummary || item.description}
                </p>

                {/* Action Brief Body */}
                {brief ? (
                  <div className="mt-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {brief.dispatchCode}
                      </span>
                      <span className="text-slate-500 font-mono">
                        ~{brief.estimatedResolutionHours} hrs resolution
                      </span>
                    </div>

                    <div>
                      <strong className="block text-slate-700 text-[11px] uppercase tracking-wider mb-0.5">
                        Operational Directives:
                      </strong>
                      <p className="text-slate-800 line-clamp-2 leading-relaxed">
                        {brief.recommendedAction}
                      </p>
                    </div>

                    <div>
                      <strong className="block text-slate-700 text-[11px] uppercase tracking-wider mb-1">
                        Equipment Manifest ({brief.equipmentRequired.length} items):
                      </strong>
                      <div className="flex flex-wrap gap-1.5">
                        {brief.equipmentRequired.slice(0, 3).map((eq, i) => (
                          <span
                            key={i}
                            className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] text-slate-700"
                          >
                            {eq}
                          </span>
                        ))}
                        {brief.equipmentRequired.length > 3 && (
                          <span className="text-slate-400 text-[11px] self-center">
                            +{brief.equipmentRequired.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-6 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center text-xs text-slate-500">
                    Action brief not generated yet for this incident.
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {item.area} · <span className="font-medium text-slate-700">{item.status}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleGenerateBrief(item.id, e)}
                    disabled={generatingId === item.id}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${generatingId === item.id ? 'animate-spin' : ''}`} />
                    <span>{generatingId === item.id ? 'Analyzing...' : 'Regenerate'}</span>
                  </button>

                  <span className="font-semibold text-blue-700 hover:text-blue-800">
                    Open Directive →
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
