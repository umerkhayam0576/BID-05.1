import React, { useState } from 'react';
import {
  FileCheck2,
  Download,
  Search,
  ExternalLink,
  ShieldCheck,
  FileText,
  Calendar,
  Lock,
  Plus
} from 'lucide-react';

interface DocumentItem {
  id: string;
  title: string;
  category: 'Contract' | 'Compliance' | 'Insurance' | 'Quality Standard';
  party: string;
  uploadedDate: string;
  fileSize: string;
  status: 'Executed' | 'Current' | 'Active';
}

const INITIAL_DOCS: DocumentItem[] = [
  {
    id: 'DOC-101',
    title: 'Master Service Agreement (MSA) - Turner Construction',
    category: 'Contract',
    party: 'Turner Construction Co.',
    uploadedDate: '2024-01-15',
    fileSize: '2.4 MB PDF',
    status: 'Executed',
  },
  {
    id: 'DOC-102',
    title: 'Commercial General Liability & Errors/Omissions ($5M COI)',
    category: 'Insurance',
    party: 'Travelers Property Casualty',
    uploadedDate: '2024-03-01',
    fileSize: '840 KB PDF',
    status: 'Current',
  },
  {
    id: 'DOC-103',
    title: 'ISO 9001:2015 Pre-Construction Quality Assurance Manual',
    category: 'Quality Standard',
    party: 'Bid Exact Quality Council',
    uploadedDate: '2024-02-10',
    fileSize: '4.8 MB PDF',
    status: 'Active',
  },
  {
    id: 'DOC-104',
    title: 'Mutual Non-Disclosure Agreement (NDA) - Clark Construction',
    category: 'Contract',
    party: 'Clark Construction Group',
    uploadedDate: '2024-04-20',
    fileSize: '512 KB PDF',
    status: 'Executed',
  },
  {
    id: 'DOC-105',
    title: 'Master Service Agreement (MSA) - Skanska USA',
    category: 'Contract',
    party: 'Skanska USA Building Inc.',
    uploadedDate: '2024-05-18',
    fileSize: '1.9 MB PDF',
    status: 'Executed',
  },
  {
    id: 'DOC-106',
    title: 'Standard Estimating SOP - 3D BIM QTO & Rebar Variance Rule',
    category: 'Quality Standard',
    party: 'Engineering Operations',
    uploadedDate: '2024-06-02',
    fileSize: '1.2 MB PDF',
    status: 'Active',
  },
];

export const DocumentsContractsView: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCS);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filtered = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.party.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' ? true : doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = (doc: DocumentItem) => {
    const blob = new Blob([`Bid Exact LLC - Document: ${doc.title}\nParty: ${doc.party}\nStatus: ${doc.status}\nVerified under ISO 9001:2015 protocol.`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>GOVERNANCE & COMPLIANCE</span>
            <span>/</span>
            <span>DOCUMENT VAULT</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Documents & Executed Contracts
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Master Service Agreements, Certificate of Insurance (COI), and ISO 9001 SOP standards
          </p>
        </div>

        <button
          onClick={() => {
            const newDoc: DocumentItem = {
              id: `DOC-${107 + Math.floor(Math.random() * 20)}`,
              title: 'Subcontractor Non-Disclosure & Estimating Service Rider',
              category: 'Contract',
              party: 'Apex Structural LLC',
              uploadedDate: new Date().toISOString().split('T')[0],
              fileSize: '1.4 MB PDF',
              status: 'Executed',
            };
            setDocuments([newDoc, ...documents]);
          }}
          className="h-9 px-4 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Vault Documents
          </div>
          <div className="text-2xl font-bold font-mono text-white">{documents.length} Files</div>
          <div className="text-[11px] text-[#4edea3] mt-2">
            100% cloud encrypted & backed up
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Active MSAs
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">6 Executed</div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Tier-1 GC coverage active
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            E&O Insurance ($5M)
          </div>
          <div className="text-2xl font-bold font-mono text-white">Current (2025)</div>
          <div className="text-[11px] text-[#4edea3] mt-2">
            Policy #TRV-8941-EO
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            ISO 9001 Compliance
          </div>
          <div className="text-2xl font-bold font-mono text-[#adc6ff]">Certified</div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Audit Clearance: Verified
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#222a3d] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#86948a] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search documents by title or entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded text-xs text-white placeholder-[#86948a] focus:outline-none focus:border-[#4edea3]"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto font-mono text-xs">
            {['all', 'Contract', 'Insurance', 'Quality Standard'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded transition-colors ${
                  categoryFilter === cat
                    ? 'bg-[#4edea3]/20 text-[#4edea3] font-bold border border-[#4edea3]/40'
                    : 'text-[#86948a] hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Types' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#0b1326] text-[#86948a] uppercase text-[10px] tracking-wider border-b border-[#222a3d]">
              <tr>
                <th className="p-3">Document Title</th>
                <th className="p-3">Classification</th>
                <th className="p-3">Counterparty / Issuer</th>
                <th className="p-3">Upload Date</th>
                <th className="p-3">Size</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d] text-[#dae2fd]">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-[#171f33]/70 transition-colors">
                  <td className="p-3 font-sans font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#4edea3] shrink-0" />
                      <span>{doc.title}</span>
                    </div>
                  </td>
                  <td className="p-3 text-[#bbcabf] font-sans">{doc.category}</td>
                  <td className="p-3 font-sans text-white">{doc.party}</td>
                  <td className="p-3 text-[#86948a]">{doc.uploadedDate}</td>
                  <td className="p-3 text-[#86948a]">{doc.fileSize}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20">
                      {doc.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-1.5 rounded bg-[#171f33] hover:bg-[#222a3d] text-[#4edea3] border border-[#2d3449] transition-colors cursor-pointer"
                      title="Download Document"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
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
