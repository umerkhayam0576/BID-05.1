import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  FileCheck2,
  AlertTriangle,
  Search,
  Download,
  CheckCircle2,
  Clock,
  Terminal,
  KeyRound,
  Sliders,
  Layers,
} from 'lucide-react';
import { SecretKeysIntegrationsPanel } from '../integrations/SecretKeysIntegrationsPanel';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  ipAddress: string;
  severity: 'INFO' | 'SECURITY' | 'MODIFICATION';
}

const AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'LOG-7721',
    timestamp: '2024-08-19 14:22:18 UTC',
    user: 'Umer Khayam (Principal)',
    action: 'Approved RFI Resolution Matrix sign-off for BID-884',
    module: 'RFI & Pre-Con Bids',
    ipAddress: '198.51.100.24',
    severity: 'MODIFICATION',
  },
  {
    id: 'LOG-7720',
    timestamp: '2024-08-19 13:45:02 UTC',
    user: 'Marcus Vance (Chief Estimator)',
    action: 'Exported structural concrete quantity variance report',
    module: 'Takeoff Engine',
    ipAddress: '198.51.100.18',
    severity: 'INFO',
  },
  {
    id: 'LOG-7719',
    timestamp: '2024-08-19 11:10:44 UTC',
    user: 'Elena Rostova (VP BIM)',
    action: 'Re-indexed LOD 350 Navisworks clash coordinates',
    module: 'VDC Modeling',
    ipAddress: '198.51.100.32',
    severity: 'MODIFICATION',
  },
  {
    id: 'LOG-7718',
    timestamp: '2024-08-19 09:02:11 UTC',
    user: 'System Automated Monitor',
    action: 'Automated SOC-2 compliance snapshot & GL checksum passed',
    module: 'Security Vault',
    ipAddress: '127.0.0.1',
    severity: 'INFO',
  },
  {
    id: 'LOG-7717',
    timestamp: '2024-08-18 17:30:55 UTC',
    user: 'David Chen (P.E. Consultant)',
    action: 'Authenticated via Hardware MFA token from authorized subnet',
    module: 'Identity & Access',
    ipAddress: '203.0.113.88',
    severity: 'SECURITY',
  },
];

export const AuditSettingsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = AUDIT_LOGS.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>GOVERNANCE & TRUST</span>
            <span>/</span>
            <span>COMPLIANCE AUDIT TRAIL</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Audit Trail, Security &amp; API Keys Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Zero-code payment gateway credentials, immutable system logs, estimate version history, and SOC-2 access security tracking
          </p>
        </div>

        <button
          onClick={() => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(AUDIT_LOGS, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "bid_exact_audit_trail.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
          }}
          className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#dae2fd] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#86948a]" />
          <span>Export Audit Log (JSON)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Compliance Standard
          </div>
          <div className="text-2xl font-bold font-mono text-white">ISO 9001:2015</div>
          <div className="text-[11px] text-[#4edea3] mt-2">
            Status: Certified & Current
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            SOC-2 Type II
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">Passing 100%</div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Automated monitoring active
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Integrity Checksum
          </div>
          <div className="text-2xl font-bold font-mono text-white">SHA-256 Valid</div>
          <div className="text-[11px] text-[#4edea3] mt-2">
            Immutable log chain
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Security Incidents
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">0 Detected</div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Past 365 Days
          </div>
        </div>
      </div>

      {/* Secret Keys & Integrations Panel (Zero-Code Management) */}
      <SecretKeysIntegrationsPanel />

      {/* Log Feed Table */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#222a3d] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#86948a] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search audit action, user, or module..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded text-xs text-white placeholder-[#86948a] focus:outline-none focus:border-[#4edea3]"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#86948a]">
            <Terminal className="w-3.5 h-3.5 text-[#4edea3]" />
            <span>Immutable Ledger Active</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#0b1326] text-[#86948a] uppercase text-[10px] tracking-wider border-b border-[#222a3d]">
              <tr>
                <th className="p-3">Log ID</th>
                <th className="p-3">Timestamp (UTC)</th>
                <th className="p-3">User Principal</th>
                <th className="p-3">Action Description</th>
                <th className="p-3">Module</th>
                <th className="p-3 text-center">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d] text-[#dae2fd]">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-[#171f33]/70 transition-colors">
                  <td className="p-3 font-semibold text-[#4edea3]">{log.id}</td>
                  <td className="p-3 text-[#86948a]">{log.timestamp}</td>
                  <td className="p-3 font-sans font-medium text-white">{log.user}</td>
                  <td className="p-3 text-[#bbcabf] font-sans">{log.action}</td>
                  <td className="p-3">
                    <span className="px-1.5 py-0.5 rounded bg-[#0b1326] text-[10px] text-[#adc6ff] border border-[#222a3d]">
                      {log.module}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        log.severity === 'SECURITY'
                          ? 'bg-[#ff7886]/10 text-[#ffb4ab] border border-[#ff7886]/20'
                          : log.severity === 'MODIFICATION'
                          ? 'bg-[#e0b44a]/10 text-[#e0b44a] border border-[#e0b44a]/20'
                          : 'bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20'
                      }`}
                    >
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
