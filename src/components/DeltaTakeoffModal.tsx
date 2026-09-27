import React, { useState } from 'react';
import {
  X,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Cpu,
  Sparkles,
} from 'lucide-react';

interface DeltaTakeoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDelta: (bidId: string, deltaAmount: number, deltaTons: number) => void;
  isApplied: boolean;
}

export const DeltaTakeoffModal: React.FC<DeltaTakeoffModalProps> = ({
  isOpen,
  onClose,
  onApplyDelta,
  isApplied,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeLayer, setActiveLayer] = useState<'all' | 'rebar' | 'delta'>('all');
  const [hoveredPad, setHoveredPad] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div
      id="modal-delta-takeoff"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-[#131b2e] border border-[#2d3449] w-full max-w-5xl rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#222a3d] flex items-center justify-between bg-[#171f33]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#4edea3]/10 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#dae2fd]">
                  Automated Quantity Takeoff Revision & CAD Diff Inspector
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3b82f6]/20 text-[#adc6ff] border border-[#3b82f6]/30 font-bold">
                  BIM ENGINE v4.8
                </span>
              </div>
              <p className="text-xs text-[#86948a]">
                Origin: <strong className="text-[#4edea3] font-mono">RFI-2024-089</strong> → Target Proposal:{' '}
                <strong className="text-[#dae2fd] font-mono">#BID-8849 Metro Heights Tower (Core & Shell)</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-[#222a3d] text-[#86948a] hover:text-[#dae2fd] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split CAD View & Cost Table */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#222a3d]">
          {/* Left: Interactive CAD View (7 cols) */}
          <div className="lg:col-span-7 p-5 flex flex-col justify-between bg-[#0b1326]/60">
            <div>
              {/* CAD Controls Bar */}
              <div className="flex items-center justify-between mb-3 text-xs">
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#86948a]">
                  <span className="text-[#4edea3] font-bold">SECTOR B</span>
                  <span>• Foundation Footing Pads F-4 through F-9</span>
                </div>

                <div className="flex items-center gap-1 bg-[#171f33] p-1 rounded border border-[#222a3d]">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
                    className="p-1 hover:bg-[#222a3d] text-[#86948a] hover:text-[#dae2fd] rounded"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono px-1 text-[#dae2fd]">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.2))}
                    className="p-1 hover:bg-[#222a3d] text-[#86948a] hover:text-[#dae2fd] rounded"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="p-1 hover:bg-[#222a3d] text-[#86948a] hover:text-[#dae2fd] rounded"
                    title="Reset Zoom"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Viewport Canvas */}
              <div className="relative w-full h-80 rounded-lg bg-[#060e20] border border-[#222a3d] overflow-hidden flex items-center justify-center select-none shadow-inner">
                {/* SVG CAD Drawing */}
                <div
                  className="transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <svg width="460" height="280" viewBox="0 0 460 280">
                    <defs>
                      <pattern
                        id="modalCadGrid"
                        width="20"
                        height="20"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 20 0 L 0 0 0 20"
                          fill="none"
                          stroke="#171f33"
                          strokeWidth="0.8"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#modalCadGrid)" />

                    {/* Column Grid Lines */}
                    <line x1="40" y1="20" x2="40" y2="260" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="140" y1="20" x2="140" y2="260" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="240" y1="20" x2="240" y2="260" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="340" y1="20" x2="340" y2="260" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="420" y1="20" x2="420" y2="260" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

                    {/* Grid Callouts */}
                    <text x="35" y="16" fill="#64748b" fontSize="10" fontFamily="monospace">GRID A</text>
                    <text x="135" y="16" fill="#64748b" fontSize="10" fontFamily="monospace">GRID B</text>
                    <text x="235" y="16" fill="#64748b" fontSize="10" fontFamily="monospace">GRID C</text>
                    <text x="335" y="16" fill="#64748b" fontSize="10" fontFamily="monospace">GRID D</text>

                    {/* Footing Pads */}
                    {[
                      { id: 'F-4', x: 60, y: 50, orig: '#8 @ 6"', rev: '#9 Epoxy Gr 60' },
                      { id: 'F-5', x: 180, y: 50, orig: '#8 @ 6"', rev: '#9 Epoxy Gr 60' },
                      { id: 'F-6', x: 300, y: 50, orig: '#8 @ 6"', rev: '#9 Epoxy Gr 60' },
                      { id: 'F-7', x: 60, y: 150, orig: '#8 @ 6"', rev: '#9 Epoxy Gr 60' },
                      { id: 'F-8', x: 180, y: 150, orig: '#8 @ 6"', rev: '#9 Epoxy Gr 60' },
                      { id: 'F-9', x: 300, y: 150, orig: '#8 @ 6"', rev: '#9 Epoxy Gr 60' },
                    ].map((pad) => (
                      <g
                        key={pad.id}
                        onMouseEnter={() => setHoveredPad(`${pad.id}: ${pad.rev} (+5.2 MT)`)}
                        onMouseLeave={() => setHoveredPad(null)}
                        className="cursor-pointer group"
                      >
                        {/* Pad concrete boundary */}
                        <rect
                          x={pad.x}
                          y={pad.y}
                          width="90"
                          height="75"
                          fill="#131b2e"
                          stroke={hoveredPad?.includes(pad.id) ? '#4edea3' : '#3b82f6'}
                          strokeWidth="1.5"
                          rx="4"
                        />
                        {/* Revised Dense Rebar Cage (#9 bars) */}
                        <rect
                          x={pad.x + 8}
                          y={pad.y + 8}
                          width="74"
                          height="59"
                          fill="rgba(78,222,163,0.18)"
                          stroke="#4edea3"
                          strokeWidth="1.8"
                        />
                        {/* Rebar internal mesh */}
                        <line x1={pad.x + 22} y1={pad.y + 8} x2={pad.x + 22} y2={pad.y + 67} stroke="#4edea3" strokeWidth="1" />
                        <line x1={pad.x + 36} y1={pad.y + 8} x2={pad.x + 36} y2={pad.y + 67} stroke="#4edea3" strokeWidth="1" />
                        <line x1={pad.x + 50} y1={pad.y + 8} x2={pad.x + 50} y2={pad.y + 67} stroke="#4edea3" strokeWidth="1" />
                        <line x1={pad.x + 64} y1={pad.y + 8} x2={pad.x + 64} y2={pad.y + 67} stroke="#4edea3" strokeWidth="1" />

                        <line x1={pad.x + 8} y1={pad.y + 22} x2={pad.x + 82} y2={pad.y + 22} stroke="#4edea3" strokeWidth="1" />
                        <line x1={pad.x + 8} y1={pad.y + 36} x2={pad.x + 82} y2={pad.y + 36} stroke="#4edea3" strokeWidth="1" />
                        <line x1={pad.x + 8} y1={pad.y + 50} x2={pad.x + 82} y2={pad.y + 50} stroke="#4edea3" strokeWidth="1" />

                        {/* Label */}
                        <text
                          x={pad.x + 45}
                          y={pad.y + 42}
                          fill="#ffffff"
                          fontSize="11"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          PAD {pad.id}
                        </text>
                        <text
                          x={pad.x + 45}
                          y={pad.y + 56}
                          fill="#4edea3"
                          fontSize="8"
                          fontWeight="600"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          +5.2 MT DELTA
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>

                {/* Status HUD Overlays */}
                <div className="absolute top-2 left-2 px-2 py-1 rounded bg-[#0b1326]/90 border border-[#222a3d] font-mono text-[10px] text-[#4edea3]">
                  {hoveredPad || 'Hover over footing pads to inspect delta'}
                </div>

                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#171f33]/90 border border-[#2d3449] font-mono text-[10px] text-[#86948a]">
                    Scale: 1/4" = 1'-0"
                  </span>
                </div>
              </div>
            </div>

            {/* Layer Toggles */}
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-[#86948a] font-mono text-[11px]">Active BIM Layers:</span>
              <button
                onClick={() => setActiveLayer('all')}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                  activeLayer === 'all'
                    ? 'bg-[#222a3d] text-[#dae2fd] border border-[#3c4a42]'
                    : 'text-[#86948a] hover:text-[#dae2fd]'
                }`}
              >
                All Schedules
              </button>
              <button
                onClick={() => setActiveLayer('delta')}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                  activeLayer === 'delta'
                    ? 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/40'
                    : 'text-[#86948a] hover:text-[#dae2fd]'
                }`}
              >
                +31.2 MT Delta Overlay
              </button>
            </div>
          </div>

          {/* Right: Quantity & Pricing Breakdown (5 cols) */}
          <div className="lg:col-span-5 p-5 flex flex-col justify-between bg-[#131b2e]">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#86948a] font-bold">
                  Takeoff Reconciliation
                </span>
                <h4 className="text-sm font-bold text-[#dae2fd] mt-0.5">
                  CSI Division 03 20 00 Concrete Reinforcing
                </h4>
                <p className="text-xs text-[#86948a] mt-0.5">
                  Re-specification from drawing S-204 to Foundation Schedule Note 12
                </p>
              </div>

              {/* Delta Comparison Table */}
              <div className="bg-[#0b1326] border border-[#222a3d] rounded-lg p-3 space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#222a3d]">
                  <span className="text-[#86948a]">Original Steel Tonnage:</span>
                  <span className="font-semibold text-[#dae2fd]">148.5 Metric Tons</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#222a3d] text-[#4edea3]">
                  <span className="font-semibold">+ RFI-089 Schedule Delta:</span>
                  <span className="font-bold">+31.2 Metric Tons</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#222a3d]">
                  <span className="text-[#86948a]">Fabricated Steel Rate:</span>
                  <span className="font-semibold text-[#dae2fd]">$1,543.27 / MT</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-1">
                  <span className="text-[#bbcabf] font-bold">Net Financial Delta:</span>
                  <span className="text-[#4edea3] font-bold text-base">
                    +$48,150.00
                  </span>
                </div>
              </div>

              {/* Impact on Proposal #BID-8849 */}
              <div className="p-3 bg-[#171f33] border border-[#2d3449] rounded-lg space-y-2">
                <div className="text-[11px] font-mono uppercase text-[#86948a] font-bold">
                  Proposal Total Impact
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#86948a]">Current Proposal Base:</span>
                  <span className="text-[#dae2fd] line-through">$740,000.00</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono font-bold text-[#4edea3]">
                  <span>Revised Takeoff Package:</span>
                  <span>$788,150.00</span>
                </div>
                <div className="text-[11px] text-[#bbcabf] leading-relaxed pt-1 border-t border-[#222a3d]">
                  Applying this delta clears the RFI blocker on <strong className="text-white">#BID-8849</strong> and updates the gross margin allocation prior to final submission.
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#222a3d] space-y-2">
              {isApplied ? (
                <div className="w-full py-2.5 px-3 rounded-md bg-[#4edea3]/15 border border-[#4edea3]/30 text-[#4edea3] text-xs font-mono font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Delta Applied to #BID-8849 ($788,150.00)</span>
                </div>
              ) : (
                <button
                  id="btn-apply-delta-confirm"
                  onClick={() => {
                    onApplyDelta('BID-8849', 48150, 31.2);
                  }}
                  className="w-full py-2.5 px-4 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-bold font-mono uppercase tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>Accept Delta & Apply +$48,150 to #BID-8849</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full py-2 text-xs font-mono text-[#86948a] hover:text-[#dae2fd] transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
