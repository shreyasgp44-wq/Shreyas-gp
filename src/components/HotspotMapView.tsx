import React, { useState } from 'react';
import {
  MapPin,
  Flame,
  AlertTriangle,
  Layers,
  Eye,
  Building2,
  Navigation,
  Sparkles,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { Complaint, Hotspot, Category, Priority } from '../types/index.ts';

interface HotspotMapViewProps {
  complaints: Complaint[];
  hotspots: Hotspot[];
  onSelectComplaint: (complaint: Complaint) => void;
}

export const HotspotMapView: React.FC<HotspotMapViewProps> = ({
  complaints,
  hotspots,
  onSelectComplaint,
}) => {
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(complaints[0] || null);
  const [mapLayer, setMapLayer] = useState<'pins' | 'heat' | 'all'>('all');

  // Compute bounding box coordinates for SVG projection
  // Lat range roughly 12.90 to 13.06, Lng range roughly 77.55 to 77.76
  const minLat = 12.905;
  const maxLat = 13.06;
  const minLng = 77.56;
  const maxLng = 77.76;

  const projectCoords = (lat: number, lng: number) => {
    // Width: 800, Height: 550
    const x = ((lng - minLng) / (maxLng - minLng)) * 720 + 40;
    // Note: Lat goes south to north, so flip Y
    const y = ((maxLat - lat) / (maxLat - minLat)) * 470 + 40;
    return { x, y };
  };

  const filteredComplaints = complaints.filter((c) => {
    if (selectedArea !== 'All' && c.area !== selectedArea) return false;
    if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4 text-rose-600" />
            <span>AI Geospatial Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Civic Complaint Hotspots & Density Map
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Real-time clustering identifies infrastructure stress zones, chronic drainage chokepoints, and high-accident corridors.
          </p>
        </div>

        {/* Layer Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setMapLayer('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                mapLayer === 'all' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              All Data
            </button>
            <button
              onClick={() => setMapLayer('heat')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                mapLayer === 'heat' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Thermal Heatzones
            </button>
            <button
              onClick={() => setMapLayer('pins')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                mapLayer === 'pins' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              Complaint Pins
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Layout: 2/3 Map Canvas + 1/3 Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive SVG City Canvas */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-md border border-slate-800 text-white relative overflow-hidden flex flex-col justify-between min-h-[580px]">
          {/* Map Controls Overlay */}
          <div className="flex flex-wrap items-center justify-between gap-3 z-10 pb-2">
            <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400">Ward:</span>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none"
              >
                <option value="All" className="bg-slate-800 text-white">All 8 Wards</option>
                {hotspots.map((h) => (
                  <option key={h.area} value={h.area} className="bg-slate-800 text-white">
                    {h.area} ({h.activeComplaints} active)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400">Filter:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none"
              >
                <option value="All" className="bg-slate-800 text-white">All Categories</option>
                <option value="Roads" className="bg-slate-800 text-white">Roads</option>
                <option value="Water" className="bg-slate-800 text-white">Water</option>
                <option value="Waste" className="bg-slate-800 text-white">Waste</option>
                <option value="Electricity" className="bg-slate-800 text-white">Electricity</option>
                <option value="Drainage" className="bg-slate-800 text-white">Drainage</option>
                <option value="Public Safety" className="bg-slate-800 text-white">Public Safety</option>
              </select>
            </div>

            {/* Pin Color Legend */}
            <div className="hidden sm:flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Critical</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>High</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Medium</span>
              </span>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative w-full flex-1 my-2">
            <svg
              viewBox="0 0 800 550"
              className="w-full h-full select-none"
              style={{ maxHeight: '480px' }}
            >
              <defs>
                {/* Radial gradients for thermal heat zones */}
                <radialGradient id="heat-severe" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.55" />
                  <stop offset="60%" stopColor="#f97316" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heat-elevated" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                  <stop offset="70%" stopColor="#eab308" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heat-moderate" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Grid Background Lines (City Grid Aesthetics) */}
              <g stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.6">
                {[80, 160, 240, 320, 400, 480].map((y) => (
                  <line key={y} x1="30" y1={y} x2="770" y2={y} />
                ))}
                {[100, 200, 300, 400, 500, 600, 700].map((x) => (
                  <line key={x} x1={x} y1="30" x2={x} y2="520" />
                ))}
              </g>

              {/* Major Arterial Connecting Road Network */}
              <g stroke="#475569" strokeWidth="2.5" strokeLinecap="round" opacity="0.7">
                {/* Outer Ring Road */}
                <path d="M 120 180 Q 250 80 450 120 T 720 220 T 640 440 T 380 480 T 150 400 Z" fill="none" />
                {/* East-West Corridor (MG Road -> Indiranagar -> Whitefield) */}
                <path d="M 180 280 L 320 270 L 460 250 L 710 240" fill="none" stroke="#64748b" strokeWidth="3" />
                {/* North-South Corridor (Hebbal -> Malleshwaram -> Jayanagar -> HSR) */}
                <path d="M 330 90 L 310 180 L 300 320 L 340 420 L 480 470" fill="none" stroke="#64748b" strokeWidth="3" />
              </g>

              {/* Thermal Heatmap Disks for Hotspot Clusters */}
              {(mapLayer === 'heat' || mapLayer === 'all') &&
                hotspots.map((h) => {
                  const pos = projectCoords(h.coordinates.lat, h.coordinates.lng);
                  const radius = h.riskLevel === 'Severe' ? 70 : h.riskLevel === 'Elevated' ? 55 : 42;
                  const gradient =
                    h.riskLevel === 'Severe'
                      ? 'url(#heat-severe)'
                      : h.riskLevel === 'Elevated'
                      ? 'url(#heat-elevated)'
                      : 'url(#heat-moderate)';

                  return (
                    <circle
                      key={`heat-${h.area}`}
                      cx={pos.x}
                      cy={pos.y}
                      r={radius}
                      fill={gradient}
                      className="pointer-events-none transition-all duration-700 animate-pulse"
                      style={{ animationDuration: '4s' }}
                    />
                  );
                })}

              {/* Ward Boundary Labels */}
              {hotspots.map((h) => {
                const pos = projectCoords(h.coordinates.lat, h.coordinates.lng);
                return (
                  <g key={`lbl-${h.area}`} className="cursor-pointer" onClick={() => setSelectedArea(h.area)}>
                    <rect
                      x={pos.x - 48}
                      y={pos.y - 32}
                      width="96"
                      height="20"
                      rx="4"
                      fill="#0f172a"
                      fillOpacity="0.85"
                      stroke={selectedArea === h.area ? '#38bdf8' : '#334155'}
                      strokeWidth={selectedArea === h.area ? '1.5' : '1'}
                    />
                    <text
                      x={pos.x}
                      y={pos.y - 18}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {h.area}
                    </text>
                  </g>
                );
              })}

              {/* Complaint Pin Markers */}
              {(mapLayer === 'pins' || mapLayer === 'all') &&
                filteredComplaints.map((c) => {
                  const pos = projectCoords(c.coordinates.lat, c.coordinates.lng);
                  const isSelected = activeComplaint?.id === c.id;
                  const pinColor =
                    c.priority === 'Critical'
                      ? '#ef4444'
                      : c.priority === 'High'
                      ? '#f59e0b'
                      : c.priority === 'Medium'
                      ? '#38bdf8'
                      : '#94a3b8';

                  return (
                    <g
                      key={`pin-${c.id}`}
                      className="cursor-pointer transition-transform hover:scale-125"
                      onClick={() => setActiveComplaint(c)}
                    >
                      {/* Pulse ring for active critical pins */}
                      {c.priority === 'Critical' && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={isSelected ? '14' : '10'}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="1.5"
                          opacity="0.8"
                          className="animate-ping"
                          style={{ animationDuration: '2s' }}
                        />
                      )}

                      {/* Main Pin Dot */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isSelected ? '7' : '5'}
                        fill={pinColor}
                        stroke="#ffffff"
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                      />
                    </g>
                  );
                })}
            </svg>
          </div>

          {/* Map Footer Bar */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">City Zone Grid:</span>
              <span>12.9716° N, 77.5946° E</span>
              <span>·</span>
              <span>Showing {filteredComplaints.length} geo-tagged pins</span>
            </div>

            <div className="text-[11px] font-mono text-slate-500">
              Click any pin or ward to inspect incident
            </div>
          </div>
        </div>

        {/* Selected Incident & Hotspot Details Panel */}
        <div className="space-y-6">
          {activeComplaint ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-mono font-semibold text-blue-700">
                  {activeComplaint.id}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    activeComplaint.priority === 'Critical'
                      ? 'bg-rose-50 text-rose-700'
                      : activeComplaint.priority === 'High'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  Priority {activeComplaint.priorityScore}/100 ({activeComplaint.priority})
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  {activeComplaint.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 line-clamp-3">
                  {activeComplaint.description}
                </p>
              </div>

              {/* Photo preview if available */}
              {activeComplaint.imageUrl && (
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={activeComplaint.imageUrl}
                    alt={activeComplaint.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}

              {/* AI Triage Snippet */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Risk Rationale</span>
                </div>
                <p className="text-slate-700 text-[11px]">
                  {activeComplaint.priorityExplanation}
                </p>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  <strong>Location:</strong> {activeComplaint.address}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectComplaint(activeComplaint)}
                  className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Open Full Action Brief →
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-500">
              Select any marker on the map to inspect incident details.
            </div>
          )}

          {/* Hotspots Summary Card List */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Ward Risk Hierarchy
            </h3>

            <div className="space-y-2">
              {hotspots.map((h) => (
                <div
                  key={h.area}
                  onClick={() => setSelectedArea(h.area)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    selectedArea === h.area
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-900">{h.area}</div>
                    <div className="text-[11px] text-slate-500">
                      Top Issue: {h.topCategory} · {h.activeComplaints} active
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      h.riskLevel === 'Severe'
                        ? 'bg-rose-100 text-rose-800'
                        : h.riskLevel === 'Elevated'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {h.riskLevel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
