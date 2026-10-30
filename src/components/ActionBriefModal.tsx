import React, { useState } from 'react';
import {
  X,
  Wrench,
  Clock,
  HardHat,
  ShieldAlert,
  Sparkles,
  Building2,
  FileCheck2,
  CheckCircle2,
  RefreshCw,
  Printer,
  Copy,
  Check,
  Send,
} from 'lucide-react';
import { Complaint, ComplaintStatus, Department, Priority } from '../types/index.ts';
import { generateActionBrief, updateComplaint } from '../api.ts';

interface ActionBriefModalProps {
  complaint: Complaint | null;
  onClose: () => void;
  onComplaintUpdated: (updated: Complaint) => void;
}

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

export const ActionBriefModal: React.FC<ActionBriefModalProps> = ({
  complaint,
  onClose,
  onComplaintUpdated,
}) => {
  if (!complaint) return null;

  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [officerNote, setOfficerNote] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const handleRegenerateBrief = async () => {
    setIsGenerating(true);
    try {
      const newBrief = await generateActionBrief(complaint.id);
      const updated = {
        ...complaint,
        actionBrief: newBrief,
      };
      onComplaintUpdated(updated);
    } catch (err) {
      console.error('Failed to regenerate brief:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusChange = async (newStatus: ComplaintStatus) => {
    setIsSavingStatus(true);
    try {
      const updated = await updateComplaint(complaint.id, {
        status: newStatus,
        actor: 'Municipal Field Dispatch Officer',
        note: officerNote ? officerNote : `Status changed to ${newStatus}.`,
      });
      setOfficerNote('');
      onComplaintUpdated(updated);
    } catch (err) {
      console.error('Failed to change status:', err);
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleDepartmentChange = async (newDept: Department) => {
    try {
      const updated = await updateComplaint(complaint.id, {
        department: newDept,
        actor: 'Dispatch Superintendent',
        note: `Jurisdiction transferred to ${newDept}.`,
      });
      onComplaintUpdated(updated);
    } catch (err) {
      console.error('Failed to update department:', err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerNote.trim()) return;

    setIsSavingStatus(true);
    try {
      const updated = await updateComplaint(complaint.id, {
        actor: 'Field Operations Engineer',
        note: officerNote.trim(),
      });
      setOfficerNote('');
      onComplaintUpdated(updated);
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setIsSavingStatus(false);
    }
  };

  const copyDispatchCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const brief = complaint.actionBrief;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2 text-xs mb-1">
              <span className="font-mono font-bold text-blue-700 tabular-nums">
                {complaint.id}
              </span>
              <span className="text-slate-400">·</span>
              <span className="font-semibold text-slate-700">{complaint.category}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600">{complaint.area}</span>
              <span className="text-slate-400">·</span>
              <span
                className={`font-mono font-bold ${
                  complaint.priority === 'Critical'
                    ? 'text-rose-600'
                    : complaint.priority === 'High'
                    ? 'text-amber-600'
                    : 'text-blue-600'
                }`}
              >
                {complaint.priorityScore}/100 ({complaint.priority})
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {complaint.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Quick Status & Department Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Update Status:</label>
              <div className="flex flex-wrap gap-1">
                {STATUSES.map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    disabled={isSavingStatus}
                    className={`px-2.5 py-1.5 rounded-md font-semibold transition-all ${
                      complaint.status === st
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Assigned Department:</label>
              <select
                value={complaint.department}
                onChange={(e) => handleDepartmentChange(e.target.value as Department)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* AI PRIORITY EXPLANATION */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs space-y-2">
            <div className="flex items-center justify-between text-blue-900 font-bold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-700" />
                <span>AI Priority Triage Analysis</span>
              </span>
              <span className="font-mono">
                Urgency: {complaint.urgencyScore}/10 · Impact: {complaint.publicImpactScore}/10
              </span>
            </div>
            <p className="text-slate-800 text-xs leading-relaxed">
              <strong className="text-slate-900">Why this priority was assigned:</strong>{' '}
              {complaint.priorityExplanation}
            </p>
          </div>

          {/* ACTION BRIEF SECTION */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Field Crew Action Brief
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    Tactical engineering directives generated for on-site execution
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRegenerateBrief}
                  disabled={isGenerating}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Generating...' : 'Refresh with Gemini'}</span>
                </button>
              </div>
            </div>

            {brief ? (
              <div className="space-y-4 text-xs">
                {/* Dispatch Code & Crew Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 text-[11px]">Dispatch Work Code</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono font-bold text-slate-900">{brief.dispatchCode}</span>
                      <button
                        onClick={() => copyDispatchCode(brief.dispatchCode)}
                        className="text-slate-400 hover:text-slate-700"
                        title="Copy code"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 text-[11px]">Assigned Specialized Unit</span>
                    <div className="font-semibold text-slate-900 mt-1">{brief.assignedCrew}</div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500 text-[11px]">Estimated SLA Hours</span>
                    <div className="font-mono font-bold text-blue-700 mt-1">
                      ~{brief.estimatedResolutionHours} hours to resolve
                    </div>
                  </div>
                </div>

                {/* Recommended Technical Action */}
                <div>
                  <span className="block font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                    Recommended Technical Action Plan
                  </span>
                  <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 leading-relaxed">
                    {brief.recommendedAction}
                  </p>
                </div>

                {/* Equipment Required */}
                <div>
                  <span className="block font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                    Equipment & Materials Required
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {brief.equipmentRequired.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2"
                      >
                        <HardHat className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span className="text-slate-800">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Safety Precautions */}
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold mb-1">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Mandatory Safety & Traffic Protocol</span>
                  </div>
                  <p className="text-rose-900 text-xs leading-relaxed">
                    {brief.safetyPrecautions}
                  </p>
                </div>

                <div className="text-[11px] text-slate-400 font-mono text-right">
                  Generated by: {brief.aiModel} · {new Date(brief.generatedAt).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                No action brief generated yet. Click &quot;Refresh with Gemini&quot; above to create one.
              </div>
            )}
          </div>

          {/* Add Official Officer Update Note */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
            <span className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Append Official Municipal Note
            </span>
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={officerNote}
                onChange={(e) => setOfficerNote(e.target.value)}
                placeholder="e.g., Road crew inspected at 14:00; bitumen compaction scheduled for night shift..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={!officerNote.trim() || isSavingStatus}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save Note</span>
              </button>
            </form>
          </div>

          {/* Timestamped Audit Timeline */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
            <span className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Full Incident History & Audit Trail
            </span>
            <div className="space-y-3">
              {complaint.timeline.map((evt, idx) => (
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

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            CivicAI Dispatch Intelligence Module
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
