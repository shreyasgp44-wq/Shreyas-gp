import React from 'react';
import { Target, Zap, Waves, AlertTriangle, Trash2, ArrowRight } from 'lucide-react';
import { Complaint } from '../types/index.ts';

interface HackathonTourBarProps {
  onSelectComplaint: (complaintId: string) => void;
  onOpenReportWithSample: (sample: {
    title: string;
    description: string;
    category: string;
    area: string;
    address: string;
  }) => void;
  complaints: Complaint[];
}

export const HackathonTourBar: React.FC<HackathonTourBarProps> = ({
  onSelectComplaint,
  onOpenReportWithSample,
  complaints,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 py-2.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 whitespace-nowrap">
          <Target className="w-4 h-4 text-blue-700" />
          <span>5-Minute Presentation Scenarios:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          <button
            onClick={() => onSelectComplaint('CIVIC-2026-1001')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 rounded border border-slate-200 transition-colors whitespace-nowrap shrink-0"
            title="Inspect 3 merged pothole complaints on Indiranagar 100ft Rd"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>1. Duplicate Potholes (96% Match)</span>
          </button>

          <button
            onClick={() => onSelectComplaint('CIVIC-2026-1004')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 rounded border border-slate-200 transition-colors whitespace-nowrap shrink-0"
            title="Inspect 3ft submerged railway underpass with trapped cars"
          >
            <Waves className="w-3.5 h-3.5 text-blue-600" />
            <span>2. Flooded Subway (Critical 98)</span>
          </button>

          <button
            onClick={() => onSelectComplaint('CIVIC-2026-1008')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 rounded border border-slate-200 transition-colors whitespace-nowrap shrink-0"
            title="Inspect exposed live 230V wiring at crowded bus shelter"
          >
            <Zap className="w-3.5 h-3.5 text-rose-600" />
            <span>3. Live Wire Sparking (Critical 95)</span>
          </button>

          <button
            onClick={() => onSelectComplaint('CIVIC-2026-1006')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 rounded border border-slate-200 transition-colors whitespace-nowrap shrink-0"
            title="Inspect overflowing commercial street dumpster"
          >
            <Trash2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>4. Waste Dumpster Overflow</span>
          </button>

          <button
            onClick={() =>
              onOpenReportWithSample({
                title: 'High-voltage power transformer sparking near Koramangala playground',
                description: 'The green electrical distribution box next to the children swing set is emitting loud electrical pops and blue sparks during rain. Strong burning plastic smell. Children play here every evening.',
                category: 'Auto-detect (AI)',
                area: 'Koramangala',
                address: '3rd Block Children Playground, 5th Main, Koramangala',
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded font-medium shadow-sm transition-colors whitespace-nowrap shrink-0 ml-auto"
          >
            <span>Test Live AI Triage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
