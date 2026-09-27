import React, { useState } from 'react';
import {
  Briefcase,
  DollarSign,
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Download,
  Plus
} from 'lucide-react';

interface ContractorItem {
  id: string;
  name: string;
  discipline: string;
  hourlyRate: number;
  w9Status: 'Verified' | 'Pending Renewal';
  activeProject: string;
  hoursThisMonth: number;
  totalBilled: number;
  invoiceStatus: 'Approved' | 'Review Required' | 'Paid';
}

const INITIAL_CONTRACTORS: ContractorItem[] = [
  {
    id: '1099-01',
    name: 'David Chen, P.E.',
    discipline: 'Structural Engineering Review',
    hourlyRate: 140,
    w9Status: 'Verified',
    activeProject: 'St. Jude Expansion / BIM LOD 350',
    hoursThisMonth: 64,
    totalBilled: 8960,
    invoiceStatus: 'Approved',
  },
  {
    id: '1099-02',
    name: 'Kavita Patel',
    discipline: 'Mechanical & Plumbing QTO',
    hourlyRate: 125,
    w9Status: 'Verified',
    activeProject: 'Harbor Logistics Warehouse',
    hoursThisMonth: 48,
    totalBilled: 6000,
    invoiceStatus: 'Paid',
  },
  {
    id: '1099-03',
    name: 'Apex Geotechnical LLC',
    discipline: 'Deep Foundation & Substructure',
    hourlyRate: 165,
    w9Status: 'Verified',
    activeProject: 'Embarcadero Substructure Audit',
    hoursThisMonth: 28,
    totalBilled: 4620,
    invoiceStatus: 'Review Required',
  },
  {
    id: '1099-04',
    name: 'Vertex Parametric Studio',
    discipline: 'Facade & Curtain Wall Automation',
    hourlyRate: 135,
    w9Status: 'Verified',
    activeProject: 'Metro Heights Tower Glazing Takeoff',
    hoursThisMonth: 52,
    totalBilled: 7020,
    invoiceStatus: 'Approved',
  },
];

export const ContractorsView: React.FC = () => {
  const [contractors, setContractors] = useState<ContractorItem[]>(INITIAL_CONTRACTORS);
  const [searchTerm, setSearchTerm] = useState('');

  const totalContractorBilled = contractors.reduce((sum, c) => sum + c.totalBilled, 0);

  const filtered = contractors.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.discipline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.activeProject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>PEOPLE & PARTNERS</span>
            <span>/</span>
            <span>1099 CONTRACTOR MANAGEMENT</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Contractors & 1099 Consultants
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Specialized engineering subcontractors, W-9 certifications, and hourly consulting invoices
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(contractors, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", "bid_exact_1099_contractors.json");
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#dae2fd] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#86948a]" />
            <span>Export 1099 Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Active 1099 Consultants
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {contractors.length} Verified
          </div>
          <div className="text-[11px] text-[#4edea3] mt-2">
            100% W-9 Certified on file
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Total Invoiced (This Cycle)
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">
            ${totalContractorBilled.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Average Rate: $141.25/hr
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Total Consulting Hours
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            192 Hours
          </div>
          <div className="text-[11px] text-[#4edea3] mt-2">
            Billed against direct project codes
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            IRS 1099-NEC Tracking
          </div>
          <div className="text-2xl font-bold font-mono text-[#adc6ff]">
            Compliant
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Auto-reconciled with GL accounts
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#222a3d] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#86948a] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search contractor or discipline..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded text-xs text-white placeholder-[#86948a] focus:outline-none focus:border-[#4edea3]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#0b1326] text-[#86948a] uppercase text-[10px] tracking-wider border-b border-[#222a3d]">
              <tr>
                <th className="p-3">Consultant / Firm</th>
                <th className="p-3">Specialty Discipline</th>
                <th className="p-3">Contract Rate</th>
                <th className="p-3">Active Project</th>
                <th className="p-3 text-right">Hours Logged</th>
                <th className="p-3 text-right">Billed Amount</th>
                <th className="p-3 text-center">Invoice Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d] text-[#dae2fd]">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#171f33]/70 transition-colors">
                  <td className="p-3 font-sans">
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-[11px] font-mono text-[#4edea3]">{item.w9Status}</div>
                  </td>
                  <td className="p-3 text-[#bbcabf] font-sans">{item.discipline}</td>
                  <td className="p-3 font-semibold text-white">${item.hourlyRate}/hr</td>
                  <td className="p-3 text-[#dae2fd] font-sans text-xs">{item.activeProject}</td>
                  <td className="p-3 text-right">{item.hoursThisMonth} hrs</td>
                  <td className="p-3 text-right font-bold text-[#4edea3]">
                    ${item.totalBilled.toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        item.invoiceStatus === 'Paid'
                          ? 'bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20'
                          : item.invoiceStatus === 'Approved'
                          ? 'bg-[#3b82f6]/10 text-[#adc6ff] border border-[#3b82f6]/20'
                          : 'bg-[#e0b44a]/10 text-[#e0b44a] border border-[#e0b44a]/20'
                      }`}
                    >
                      {item.invoiceStatus}
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
