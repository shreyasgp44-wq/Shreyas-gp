import React, { useState } from 'react';
import {
  CopyCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  Merge,
  ShieldCheck,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Complaint, DuplicateCluster, ComplaintStatus } from '../types/index.ts';
import { updateComplaint } from '../api.ts';

interface DuplicateDetectionCenterProps {
  duplicateClusters: DuplicateCluster[];
  allComplaints: Complaint[];
  onRefreshData: () => void;
  onSelectComplaint: (complaint: Complaint) => void;
}

export const DuplicateDetectionCenter: React.FC<DuplicateDetectionCenterProps> = ({
  duplicateClusters,
  allComplaints,
  onRefreshData,
  onSelectComplaint,
}) => {
  const [resolvingGroupId, setResolvingGroupId] = useState<string | null>(null);

  const handleResolveAllInCluster = async (cluster: DuplicateCluster) => {
    setResolvingGroupId(cluster.groupId);
    try {
      // Update primary complaint
      await updateComplaint(cluster.primaryComplaint.id, {
        status: 'Resolved',
        actor: 'Municipal Cluster Triage Manager',
        note: `Resolved via master cluster dispatch. All ${cluster.duplicates.length} duplicate citizen reports resolved simultaneously.`,
      });

      // Update all duplicate complaints
      for (const dup of cluster.duplicates) {
        await updateComplaint(dup.id, {
          status: 'Resolved',
          actor: 'CivicAI Duplicate Auto-Sync',
          note: `Auto-resolved synchronously with primary work order ${cluster.primaryComplaint.id}.`,
        });
      }

      onRefreshData();
    } catch (err) {
      console.error('Failed to resolve cluster:', err);
    } finally {
      setResolvingGroupId(null);
    }
  };

  const totalDuplicates = duplicateClusters.reduce((acc, c) => acc + c.duplicates.length, 0);
  const estimatedFuelHoursSaved = totalDuplicates * 3.5;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <CopyCheck className="w-4 h-4 text-blue-600" />
            <span>AI Duplicate Prevention & Cluster Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Semantic De-Duplication Hub
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Groups multiple citizen reports filed for the same infrastructure failure using semantic similarity and geographic proximity.
          </p>
        </div>

        <button
          onClick={onRefreshData}
          className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-cluster Database</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Active Duplicate Clusters</div>
          <div className="text-3xl font-bold font-mono text-blue-700 mt-2 tabular-nums">
            {duplicateClusters.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Multi-citizen incident hotspots</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Redundant Reports Clustered</div>
          <div className="text-3xl font-bold font-mono text-emerald-600 mt-2 tabular-nums">
            {totalDuplicates}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Single work order generated per cluster</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Field Dispatch Crew Hours Saved</div>
          <div className="text-3xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
            {estimatedFuelHoursSaved.toFixed(1)} hrs
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Eliminating redundant vehicle trips</div>
        </div>
      </div>

      {/* How it works info banner */}
      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-slate-700 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-semibold text-blue-900 text-sm">
            How CivicAI Semantic De-Duplication Works:
          </strong>
          <p className="leading-relaxed">
            When a citizen reports a hazard, the AI engine evaluates keyword embeddings, symptom descriptions (e.g. &quot;crater&quot; vs &quot;pothole&quot;), and GPS distance thresholds (&le; 100 meters). If a match is detected above 70% confidence, the ticket is linked into the primary response cluster rather than dispatching a separate crew.
          </p>
        </div>
      </div>

      {/* Duplicate Cluster Cards List */}
      <div className="space-y-6">
        {duplicateClusters.map((cluster) => {
          const isResolved =
            cluster.primaryComplaint.status === 'Resolved' &&
            cluster.duplicates.every((d) => d.status === 'Resolved');

          return (
            <div
              key={cluster.groupId}
              className={`bg-white border rounded-xl p-6 shadow-sm space-y-5 transition-all ${
                isResolved ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
              }`}
            >
              {/* Cluster Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    <Merge className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-slate-900">{cluster.groupId}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-blue-700">{cluster.primaryComplaint.category}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-600">{cluster.primaryComplaint.area}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Matched <strong className="text-slate-900">{cluster.duplicates.length + 1} citizen complaints</strong> with{' '}
                      <span className="font-mono font-semibold text-emerald-700">{cluster.similarityScore}% confidence</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isResolved ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Cluster Completely Resolved</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleResolveAllInCluster(cluster)}
                      disabled={resolvingGroupId === cluster.groupId}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      {resolvingGroupId === cluster.groupId ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Resolving Cluster...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Batch Resolve Cluster ({cluster.duplicates.length + 1} tickets)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Rationale Bar */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <strong className="text-slate-800">Cluster Reason:</strong> {cluster.reason}
                </div>
              </div>

              {/* Primary Incident */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-blue-800 uppercase tracking-wider text-[11px]">
                    Master Primary Work Order
                  </span>
                  <span className="font-mono text-blue-700 font-semibold">{cluster.primaryComplaint.id}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{cluster.primaryComplaint.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{cluster.primaryComplaint.description}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-blue-200/50">
                  <span className="text-slate-600">Reported by: {cluster.primaryComplaint.citizenName} ({cluster.primaryComplaint.address})</span>
                  <button
                    onClick={() => onSelectComplaint(cluster.primaryComplaint)}
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    View Master Action Brief →
                  </button>
                </div>
              </div>

              {/* Linked Duplicate Reports */}
              <div className="space-y-2">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Linked Citizen Duplicate Reports ({cluster.duplicates.length})
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cluster.duplicates.map((dup) => (
                    <div
                      key={dup.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-lg text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-slate-800">{dup.id}</span>
                        <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                          {dup.duplicateConfidence || cluster.similarityScore}% match
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 line-clamp-1">{dup.title}</div>
                      <p className="text-slate-500 line-clamp-2 text-[11px]">{dup.description}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>{dup.citizenName}</span>
                        <span className="font-medium text-slate-700">{dup.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
