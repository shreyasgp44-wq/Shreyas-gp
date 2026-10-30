import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Sparkles,
  ArrowUpDown,
  Building2,
  ExternalLink,
  ShieldAlert,
  CopyCheck,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Wrench,
} from 'lucide-react';
import { Complaint, DashboardStats, Category, ComplaintStatus, Priority, Department } from '../types/index.ts';
import { updateComplaint, generateActionBrief } from '../api.ts';

interface AdminDashboardProps {
  complaints: Complaint[];
  stats: DashboardStats;
  onRefreshData: () => void;
  onSelectComplaint: (complaint: Complaint) => void;
}

const CATEGORIES: Category[] = [
  'Roads',
  'Water',
  'Waste',
  'Electricity',
  'Drainage',
  'Public Safety',
];

const STATUSES: ComplaintStatus[] = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
];

const DEPARTMENTS: Department[] = [
  'Roads & Infrastructure',
  'Water Supply & Sewerage',
  'Solid Waste Management',
  'Electricity & Energy Board',
  'Stormwater & Drainage',
  'Public Safety & Vigilance',
];

const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];

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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  complaints,
  stats,
  onRefreshData,
  onSelectComplaint,
}) => {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [duplicateFilter, setDuplicateFilter] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');

  // Updating in-line
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filtered & sorted complaints
  const filtered = complaints
    .filter((c) => {
      if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
      if (selectedStatus !== 'All' && c.status !== selectedStatus) return false;
      if (selectedPriority !== 'All' && c.priority !== selectedPriority) return false;
      if (selectedArea !== 'All' && c.area !== selectedArea) return false;
      if (duplicateFilter && !c.isDuplicate) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.area.toLowerCase().includes(q) ||
          c.citizenName.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        return b.priorityScore - a.priorityScore;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleStatusChange = async (id: string, newStatus: ComplaintStatus) => {
    setUpdatingId(id);
    try {
      await updateComplaint(id, {
        status: newStatus,
        actor: 'Municipal Executive Desk',
        note: `Status updated to "${newStatus}" from Admin Command Center.`,
      });
      onRefreshData();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDepartmentChange = async (id: string, newDept: Department) => {
    setUpdatingId(id);
    try {
      await updateComplaint(id, {
        department: newDept,
        actor: 'Inter-Agency Routing Officer',
        note: `Reassigned jurisdiction to "${newDept}".`,
      });
      onRefreshData();
    } catch (err) {
      console.error('Failed to reassign department:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Municipal Command & Operations Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Real-time public works triage, priority score auditing, and inter-departmental dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefreshData}
            className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Live Records</span>
          </button>
        </div>
      </div>

      {/* KPI CARDS (Single elevation, zero-pill, tabular numbers) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Total Reported</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across 8 municipal wards</div>
        </div>

        {/* Pending */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Active / Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-600 mt-2 tabular-nums">
            {stats.pending}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.inProgress} in progress · {stats.assigned} assigned
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 mt-2 tabular-nums">
            {stats.resolved}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            {resolutionRate}% resolution rate
          </div>
        </div>

        {/* Critical & High Priority */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>High & Critical</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-600 mt-2 tabular-nums">
            {stats.highPriority}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.byPriority.Critical} urgent safety hazards
          </div>
        </div>

        {/* Clustered Duplicates */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Duplicates Merged</span>
            <CopyCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-blue-700 mt-2 tabular-nums">
            {stats.duplicatesDetected}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Prevents duplicate dispatches
          </div>
        </div>
      </div>

      {/* INTERACTIVE CHARTS & DISTRIBUTION BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Complaints Volume by Civic Category
            </h2>
            <span className="text-xs text-slate-500">Distribution analysis</span>
          </div>

          <div className="mt-5 space-y-3.5">
            {CATEGORIES.map((cat) => {
              const count = stats.byCategory[cat] || 0;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat}</span>
                    <span className="font-mono text-slate-600 tabular-nums">
                      {count} reports ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-700 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority & Status Triage Radar */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                SLA Triage Breakdown
              </h2>
              <span className="text-xs font-mono text-slate-500">0-100 Urgency</span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-rose-800">Critical Priority (&gt;90)</span>
                  <div className="text-[11px] text-rose-600">Immediate hazard / life threat</div>
                </div>
                <span className="text-base font-bold font-mono text-rose-700 tabular-nums">
                  {stats.byPriority.Critical}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-amber-800">High Priority (75-89)</span>
                  <div className="text-[11px] text-amber-600">Arterial disruption</div>
                </div>
                <span className="text-base font-bold font-mono text-amber-700 tabular-nums">
                  {stats.byPriority.High}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-blue-800">Medium Priority (50-74)</span>
                  <div className="text-[11px] text-blue-600">Standard scheduled queue</div>
                </div>
                <span className="text-base font-bold font-mono text-blue-700 tabular-nums">
                  {stats.byPriority.Medium}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">Low Priority (&lt;50)</span>
                  <div className="text-[11px] text-slate-500">Non-urgent maintenance</div>
                </div>
                <span className="text-base font-bold font-mono text-slate-700 tabular-nums">
                  {stats.byPriority.Low}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Avg. Resolution SLA:</span>
            <span className="font-mono font-semibold text-slate-800">4.8 hours</span>
          </div>
        </div>
      </div>

      {/* COMPLAINT MANAGEMENT TABLE & ADVANCED FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID, keyword, address, citizen name..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              />
            </div>

            {/* Sort & Quick actions */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md text-xs">
                <button
                  onClick={() => setSortBy('date')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    sortBy === 'date' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                  }`}
                >
                  Newest First
                </button>
                <button
                  onClick={() => setSortBy('priority')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    sortBy === 'priority' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                  }`}
                >
                  Highest Priority
                </button>
              </div>

              <button
                onClick={() => setDuplicateFilter(!duplicateFilter)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                  duplicateFilter
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <CopyCheck className="w-3.5 h-3.5" />
                <span>Duplicates Only ({stats.duplicatesDetected})</span>
              </button>
            </div>
          </div>

          {/* Filter Dropdowns Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
            {/* Category */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="All">All Categories ({stats.total})</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c} ({stats.byCategory[c] || 0})</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="All">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="All">All Priorities</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p} ({stats.byPriority[p] || 0})</option>
                ))}
              </select>
            </div>

            {/* Area */}
            <div>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="All">All Municipal Wards</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>{a} ({stats.byArea[a] || 0})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Issue Title & Summary</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Ward / Area</th>
                <th className="py-3 px-3">Priority Score</th>
                <th className="py-3 px-3">Assigned Department</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No complaints match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectComplaint(item)}
                  >
                    {/* Ticket ID */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-700 tabular-nums whitespace-nowrap">
                      {item.id}
                      {item.isDuplicate && (
                        <div className="text-[10px] text-amber-700 font-sans font-normal">
                          [Merged Dup]
                        </div>
                      )}
                    </td>

                    {/* Title & AI Summary */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <div className="font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-slate-500 line-clamp-1 text-[11px] mt-0.5">
                        {item.aiSummary || item.description}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-700 font-medium">
                      {item.category}
                    </td>

                    {/* Ward / Area */}
                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-600">
                      {item.area}
                    </td>

                    {/* Priority Score */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono tabular-nums">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.priority === 'Critical'
                              ? 'bg-rose-600'
                              : item.priority === 'High'
                              ? 'bg-amber-500'
                              : item.priority === 'Medium'
                              ? 'bg-blue-600'
                              : 'bg-slate-400'
                          }`}
                        />
                        <strong className="text-slate-900">{item.priorityScore}</strong>
                        <span className="text-slate-400 font-sans text-[11px]">({item.priority})</span>
                      </div>
                    </td>

                    {/* Assigned Department (Dropdown) */}
                    <td
                      className="py-3.5 px-3 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={item.department}
                        disabled={updatingId === item.id}
                        onChange={(e) => handleDepartmentChange(item.id, e.target.value as Department)}
                        className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] text-slate-800 font-medium hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Status (Dropdown) */}
                    <td
                      className="py-3.5 px-3 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={item.status}
                        disabled={updatingId === item.id}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as ComplaintStatus)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold border focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                          item.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : item.status === 'In Progress'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : item.status === 'Assigned'
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : item.status === 'Under Review'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectComplaint(item)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded transition-colors"
                      >
                        Action Brief →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-900">{filtered.length}</strong> of{' '}
            <strong className="text-slate-900">{complaints.length}</strong> total complaints
          </div>
          <div className="font-mono text-[11px]">
            CivicAI Audit Protocol v2026.1
          </div>
        </div>
      </div>
    </div>
  );
};
