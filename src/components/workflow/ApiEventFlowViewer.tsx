import React, { useState } from 'react';
import {
  X,
  Zap,
  Activity,
  Send,
  CheckCircle2,
  Clock,
  ArrowRight,
  Code2,
  Copy,
  Check,
  Play,
  Terminal,
  RefreshCw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { WORKFLOW_API_ENDPOINTS } from '../../data/workflowData';
import { WorkflowWebhookEvent } from '../../types/workflow';

interface ApiEventFlowViewerProps {
  isOpen: boolean;
  onClose: () => void;
  events: WorkflowWebhookEvent[];
  onTriggerSimulatedEvent: (eventType: WorkflowWebhookEvent['eventType']) => void;
}

export const ApiEventFlowViewer: React.FC<ApiEventFlowViewerProps> = ({
  isOpen,
  onClose,
  events,
  onTriggerSimulatedEvent,
}) => {
  const [selectedEndpointIndex, setSelectedEndpointIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'event_pipeline' | 'live_telemetry'>('event_pipeline');
  const [copiedPath, setCopiedPath] = useState(false);

  if (!isOpen) return null;

  const currentEndpoint = WORKFLOW_API_ENDPOINTS[selectedEndpointIndex] || WORKFLOW_API_ENDPOINTS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center text-[#3b82f6]">
              <Zap className="w-5 h-5 text-[#adc6ff]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  API &amp; Event-Driven Architecture Pipeline
                </h2>
                <span className="px-2 py-0.5 rounded bg-[#3b82f6]/15 border border-[#3b82f6]/30 text-[10px] font-mono text-[#adc6ff] font-semibold">
                  Event-Driven Webhooks + REST v1
                </span>
              </div>
              <p className="text-xs text-[#86948a]">
                Asynchronous state transition pipeline: Intake &rarr; Quote Generation &rarr; Stripe Payment &rarr; Auto-Activation &rarr; Allocation &rarr; QA Release
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-[#86948a] hover:text-white rounded-md hover:bg-[#1f283d] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="px-5 py-2.5 bg-[#0e1628] border-b border-[#222a3d] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1 font-mono text-xs">
            <button
              onClick={() => setActiveTab('event_pipeline')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'event_pipeline'
                  ? 'bg-[#3b82f6]/20 text-[#adc6ff] font-bold border border-[#3b82f6]/40'
                  : 'text-[#86948a] hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Event Lifecycle Pipeline</span>
            </button>
            <button
              onClick={() => setActiveTab('endpoints')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'endpoints'
                  ? 'bg-[#3b82f6]/20 text-[#adc6ff] font-bold border border-[#3b82f6]/40'
                  : 'text-[#86948a] hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>REST Endpoints &amp; Payloads</span>
            </button>
            <button
              onClick={() => setActiveTab('live_telemetry')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'live_telemetry'
                  ? 'bg-[#3b82f6]/20 text-[#adc6ff] font-bold border border-[#3b82f6]/40'
                  : 'text-[#86948a] hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Live Webhook Telemetry ({events.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onTriggerSimulatedEvent('payment.deposit_succeeded')}
              className="h-7 px-2.5 rounded bg-[#4edea3]/20 hover:bg-[#4edea3]/30 border border-[#4edea3]/40 text-[#4edea3] text-[11px] font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Fire Test Webhook</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0b1326]">
          {activeTab === 'event_pipeline' && (
            <div className="space-y-6">
              {/* Architecture Explanation Card */}
              <div className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-[#adc6ff] font-semibold mb-1">
                    Event-Driven State Machine Pattern
                  </div>
                  <div className="text-sm text-white font-medium">
                    Asynchronous webhook dispatch ensures decoupling between customer-facing actions and internal resource operations.
                  </div>
                  <div className="text-xs text-[#86948a] mt-1">
                    Every event is cryptographically signed using SHA-256 HMAC and recorded in the audit ledger with idempotency keys.
                  </div>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20 font-bold">
                    Zero-Polling Webhooks
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#adc6ff]/10 text-[#adc6ff] border border-[#adc6ff]/20">
                    &lt;150ms Latency
                  </span>
                </div>
              </div>

              {/* Step-by-Step Flow Diagrams */}
              <div className="space-y-4">
                <div className="text-xs font-mono uppercase tracking-wider text-[#86948a] font-semibold">
                  End-to-End Event Stream
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Phase 1 */}
                  <div className="p-4 rounded-lg bg-[#131b2e] border border-[#222a3d] relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#222a3d] text-[#86948a] font-bold">
                        STEP 01
                      </span>
                      <span className="font-mono text-[10px] text-[#4edea3]">Inbound Trigger</span>
                    </div>
                    <div className="text-sm font-bold text-white mb-1">
                      intake.received
                    </div>
                    <p className="text-xs text-[#bbcabf] mb-3">
                      Email parsing worker or web portal form converts RFQ into an intake record. NLP tags CSI divisions automatically.
                    </p>
                    <div className="text-[10px] font-mono p-2 rounded bg-[#0b1326] text-[#adc6ff] border border-[#222a3d]">
                      POST /api/v1/intake/email-webhook
                    </div>
                  </div>

                  {/* Phase 2 */}
                  <div className="p-4 rounded-lg bg-[#131b2e] border border-[#222a3d] relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#222a3d] text-[#86948a] font-bold">
                        STEP 02
                      </span>
                      <span className="font-mono text-[10px] text-[#4edea3]">Calculation</span>
                    </div>
                    <div className="text-sm font-bold text-white mb-1">
                      quote.dispatched
                    </div>
                    <p className="text-xs text-[#bbcabf] mb-3">
                      Internal team sets line items, markup, and required deposit %. Generates unique HMAC approval token link.
                    </p>
                    <div className="text-[10px] font-mono p-2 rounded bg-[#0b1326] text-[#adc6ff] border border-[#222a3d]">
                      POST /api/v1/quotes/generate
                    </div>
                  </div>

                  {/* Phase 3 */}
                  <div className="p-4 rounded-lg bg-[#131b2e] border border-[#4edea3]/40 relative bg-gradient-to-b from-[#131b2e] to-[#132728]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] font-bold">
                        STEP 03 (CRITICAL)
                      </span>
                      <span className="font-mono text-[10px] text-[#4edea3]">Stripe Gateway</span>
                    </div>
                    <div className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#4edea3]" />
                      payment.deposit_succeeded
                    </div>
                    <p className="text-xs text-[#bbcabf] mb-3">
                      Client executes digital signature &amp; pays deposit via Stripe. Webhook verifies charge and marks quote approved.
                    </p>
                    <div className="text-[10px] font-mono p-2 rounded bg-[#0b1326] text-[#4edea3] border border-[#4edea3]/30">
                      POST /api/v1/webhooks/stripe
                    </div>
                  </div>

                  {/* Phase 4 */}
                  <div className="p-4 rounded-lg bg-[#131b2e] border border-[#222a3d] relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#222a3d] text-[#86948a] font-bold">
                        STEP 04
                      </span>
                      <span className="font-mono text-[10px] text-[#adc6ff]">Automatic State</span>
                    </div>
                    <div className="text-sm font-bold text-white mb-1">
                      project.activated
                    </div>
                    <p className="text-xs text-[#bbcabf] mb-3">
                      Activator instantiates active Project record, establishes contract value, milestone schedules, and alerts PM team.
                    </p>
                    <div className="text-[10px] font-mono p-2 rounded bg-[#0b1326] text-[#adc6ff] border border-[#222a3d]">
                      Internal Trigger: quotes.status = 'paid'
                    </div>
                  </div>

                  {/* Phase 5 */}
                  <div className="p-4 rounded-lg bg-[#131b2e] border border-[#222a3d] relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#222a3d] text-[#86948a] font-bold">
                        STEP 05
                      </span>
                      <span className="font-mono text-[10px] text-[#adc6ff]">Smart Allocation</span>
                    </div>
                    <div className="text-sm font-bold text-white mb-1">
                      resource.auto_allocated
                    </div>
                    <p className="text-xs text-[#bbcabf] mb-3">
                      Matching algorithm scans estimator workload (&lt;40h) and qualifications. If capacity is exhausted, falls back to PM queue.
                    </p>
                    <div className="text-[10px] font-mono p-2 rounded bg-[#0b1326] text-[#adc6ff] border border-[#222a3d]">
                      POST /api/v1/projects/smart-allocate
                    </div>
                  </div>

                  {/* Phase 6 */}
                  <div className="p-4 rounded-lg bg-[#131b2e] border border-[#222a3d] relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#222a3d] text-[#86948a] font-bold">
                        STEP 06
                      </span>
                      <span className="font-mono text-[10px] text-[#4edea3]">QA &amp; Release</span>
                    </div>
                    <div className="text-sm font-bold text-white mb-1">
                      deliverables.released
                    </div>
                    <p className="text-xs text-[#bbcabf] mb-3">
                      Senior technical auditor certifies 4-point QA protocol. Final Excel QTO, BIM model, and certificate unlocked on Client Portal.
                    </p>
                    <div className="text-[10px] font-mono p-2 rounded bg-[#0b1326] text-[#adc6ff] border border-[#222a3d]">
                      POST /api/v1/projects/:id/qa-signoff
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'endpoints' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Endpoint List (Left) */}
              <div className="lg:col-span-5 space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-[#86948a] font-semibold mb-2">
                  Standard REST API Specifications
                </div>
                {WORKFLOW_API_ENDPOINTS.map((ep, i) => (
                  <button
                    key={ep.path}
                    onClick={() => setSelectedEndpointIndex(i)}
                    className={`w-full p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      selectedEndpointIndex === i
                        ? 'bg-[#172036] border-[#3b82f6] shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                        : 'bg-[#131b2e] border-[#222a3d] hover:border-[#3b4763]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-mono text-xs mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] font-bold text-[10px]">
                        {ep.method}
                      </span>
                      <span className="text-white font-medium truncate">{ep.path}</span>
                    </div>
                    <div className="text-xs text-[#86948a] font-sans">{ep.title}</div>
                  </button>
                ))}
              </div>

              {/* Selected Endpoint Details (Right) */}
              <div className="lg:col-span-7 bg-[#131b2e] border border-[#222a3d] rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#222a3d] pb-3">
                  <div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] font-bold mr-2">
                      {currentEndpoint.method}
                    </span>
                    <span className="font-mono text-sm font-bold text-white">
                      {currentEndpoint.path}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentEndpoint.path);
                      setCopiedPath(true);
                      setTimeout(() => setCopiedPath(false), 1500);
                    }}
                    className="p-1 text-[#86948a] hover:text-white rounded"
                  >
                    {copiedPath ? <Check className="w-4 h-4 text-[#4edea3]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div>
                  <div className="text-xs font-mono text-[#86948a] uppercase mb-1">Description</div>
                  <p className="text-xs text-[#dae2fd]">{currentEndpoint.description}</p>
                </div>

                <div>
                  <div className="text-xs font-mono text-[#86948a] uppercase mb-1">Headers</div>
                  <pre className="p-2 rounded bg-[#0b1326] text-[11px] font-mono text-[#adc6ff] border border-[#222a3d]">
                    {currentEndpoint.headers}
                  </pre>
                </div>

                <div>
                  <div className="text-xs font-mono text-[#86948a] uppercase mb-1">Sample Request Body (JSON)</div>
                  <pre className="p-3 rounded bg-[#0b1326] text-[11px] font-mono text-[#dae2fd] border border-[#222a3d] overflow-x-auto max-h-44">
                    {JSON.stringify(currentEndpoint.samplePayload, null, 2)}
                  </pre>
                </div>

                <div>
                  <div className="text-xs font-mono text-[#86948a] uppercase mb-1">Sample Response Body (200 OK)</div>
                  <pre className="p-3 rounded bg-[#0b1326] text-[11px] font-mono text-[#4edea3] border border-[#222a3d] overflow-x-auto max-h-44">
                    {JSON.stringify(currentEndpoint.sampleResponse, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'live_telemetry' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#86948a] font-semibold">
                  Live Webhook Telemetry Stream
                </span>
                <span className="text-xs font-mono text-[#4edea3] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
                  Listener Active on /api/v1/webhooks/*
                </span>
              </div>

              <div className="overflow-x-auto border border-[#222a3d] rounded-xl bg-[#131b2e]">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#0b1326] text-[#86948a] uppercase text-[10px] tracking-wider border-b border-[#222a3d]">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Event Type</th>
                      <th className="p-3">Source Service</th>
                      <th className="p-3">Target Entity</th>
                      <th className="p-3">Payload Summary</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222a3d] text-[#dae2fd]">
                    {events.map((evt) => (
                      <tr key={evt.id} className="hover:bg-[#171f33]/60">
                        <td className="p-3 text-[#86948a] whitespace-nowrap">{evt.timestamp}</td>
                        <td className="p-3 font-bold text-white">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              evt.eventType.includes('succeeded') || evt.eventType.includes('passed')
                                ? 'bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30'
                                : evt.eventType.includes('activated')
                                ? 'bg-[#adc6ff]/15 text-[#adc6ff] border border-[#adc6ff]/30'
                                : 'bg-[#222a3d] text-[#dae2fd]'
                            }`}
                          >
                            {evt.eventType}
                          </span>
                        </td>
                        <td className="p-3 text-[#adc6ff]">{evt.sourceService}</td>
                        <td className="p-3 font-medium text-white">{evt.entityId}</td>
                        <td className="p-3 text-[#bbcabf] font-sans max-w-md truncate">
                          {evt.payloadSummary}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20 font-bold">
                            {evt.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
          <div className="flex items-center gap-2 text-xs text-[#86948a]">
            <ShieldCheck className="w-4 h-4 text-[#4edea3]" />
            <span>Cryptographic webhook authentication with HMAC-SHA256 signature verification enabled</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#171f33] hover:bg-[#222a3d] text-xs text-white font-medium border border-[#2d3449] cursor-pointer"
          >
            Close Pipeline
          </button>
        </div>
      </div>
    </div>
  );
};
