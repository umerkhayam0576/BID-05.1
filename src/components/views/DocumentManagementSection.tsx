import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FolderArchive,
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  AlertCircle,
  FileCheck2,
  Lock,
  ExternalLink,
  Plus,
  RefreshCw,
  Eye,
  Check,
  FileUp,
  Key,
  Info,
  Building2,
  Calendar,
  X
} from 'lucide-react';
import { MockFileService, ManagedDocument } from '../../services/mockFileService';
import { ClientItem } from '../../types';

interface DocumentManagementSectionProps {
  activeClient: ClientItem;
  displayedProjects: Array<{
    id: string;
    title: string;
    gc: string;
    estimateValue?: number;
  }>;
  onDocumentDownloaded?: (fileName: string, hash: string) => void;
}

export const DocumentManagementSection: React.FC<DocumentManagementSectionProps> = ({
  activeClient,
  displayedProjects,
  onDocumentDownloaded,
}) => {
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  // Modal State for Contract Upload
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProjectId, setUploadProjectId] = useState<string>(
    displayedProjects[0]?.id || 'BID-2024-884'
  );
  const [signerName, setSignerName] = useState<string>(activeClient.contact?.name || 'Project Executive');
  const [signerEmail, setSignerEmail] = useState<string>(activeClient.contact?.email || 'estimating@client.com');
  const [signerTitle, setSignerTitle] = useState<string>(activeClient.contact?.title || 'Pre-Construction VP');
  const [contractValue, setContractValue] = useState<number>(82327);
  const [notes, setNotes] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccessToast, setUploadSuccessToast] = useState<string | null>(null);

  // Inspector Modal State
  const [inspectingDoc, setInspectingDoc] = useState<ManagedDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch documents from MockFileService
  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await MockFileService.getDocuments({
        clientId: activeClient.name,
      });
      setDocuments(docs);
    } catch (err) {
      console.error('Error loading documents from MockFileService:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeClient.name]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.projectTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'ALL' || doc.category === selectedCategory;

      const matchesProject =
        selectedProjectId === 'ALL' || doc.projectId === selectedProjectId;

      return matchesSearch && matchesCategory && matchesProject;
    });
  }, [documents, searchQuery, selectedCategory, selectedProjectId]);

  // Handle Download trigger
  const handleDownload = (doc: ManagedDocument) => {
    if (!doc.isDownloadable) return;
    const result = MockFileService.downloadDocument(
      doc,
      `${activeClient.contact?.name || 'Client Lead'} (${activeClient.name})`
    );
    // Refresh local document download counts
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, downloadCount: (d.downloadCount || 0) + 1 } : d))
    );

    if (onDocumentDownloaded) {
      onDocumentDownloaded(result.fileName, result.hash);
    }
  };

  // Handle Contract PDF Upload Submission
  const handleContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    try {
      const targetProject = displayedProjects.find((p) => p.id === uploadProjectId) || displayedProjects[0];

      const newDoc = await MockFileService.uploadSignedContract({
        projectId: targetProject?.id || 'BID-2024-884',
        projectTitle: targetProject?.title || `${activeClient.name} Pre-Con Scope`,
        clientId: activeClient.id,
        clientName: activeClient.name,
        file: uploadFile,
        signerName,
        signerEmail,
        signerTitle,
        contractScopeValue: contractValue,
        depositPaid: true,
        notes,
      });

      setDocuments((prev) => [newDoc, ...prev]);
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setNotes('');
      setUploadSuccessToast(
        `Successfully uploaded and verified signed contract "${newDoc.fileName}" (SHA-256: ${newDoc.sha256Hash.substring(0, 12)}...)`
      );

      setTimeout(() => {
        setUploadSuccessToast(null);
      }, 5000);
    } catch (err) {
      console.error('Failed to upload signed contract:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Drag & drop handlers
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setUploadFile(file);
      } else {
        alert('Please select an authorized PDF format file (.pdf) for signed contracts.');
      }
    }
  };

  return (
    <div className="space-y-5 text-[#dae2fd]">
      {/* Toast Notification */}
      {uploadSuccessToast && (
        <div className="p-3.5 rounded-xl bg-[#4edea3]/15 border border-[#4edea3]/40 text-[#4edea3] flex items-center justify-between text-xs font-mono animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{uploadSuccessToast}</span>
          </div>
          <button
            onClick={() => setUploadSuccessToast(null)}
            className="text-[#94a3b8] hover:text-white cursor-pointer ml-3 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#131b2e] p-5 rounded-2xl border border-[#222a3d] shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <FolderArchive className="w-5 h-5 text-[#38bdf8]" />
              <span>Project Document &amp; Contract Management</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 font-mono text-[10px] font-bold">
              Mock File Service API
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] max-w-2xl font-sans">
            Central repository for verified deliverables, quantity takeoff spreadsheets, accuracy certificates,
            and countersigned contracts with automated SHA-256 cryptographic verification.
          </p>
        </div>

        {/* Upload Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#38bdf8] hover:bg-[#0284c7] text-[#0b1326] font-bold text-xs font-mono flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Signed Contract PDF</span>
          </button>
        </div>
      </div>

      {/* Service Metrics / Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#222a3d]">
          <div className="text-[10px] font-mono text-[#94a3b8] uppercase flex items-center justify-between">
            <span>Total Managed Files</span>
            <FolderArchive className="w-3.5 h-3.5 text-[#38bdf8]" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {documents.length}
          </div>
          <div className="text-[10px] text-[#4edea3] font-mono mt-0.5">
            Cryptographically Indexed
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#222a3d]">
          <div className="text-[10px] font-mono text-[#94a3b8] uppercase flex items-center justify-between">
            <span>Deliverables Ready</span>
            <Download className="w-3.5 h-3.5 text-[#4edea3]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#4edea3] mt-1">
            {documents.filter((d) => d.category === 'DELIVERABLE' && d.isDownloadable).length}
          </div>
          <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5">
            Passed Dual Peer Audit
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#222a3d]">
          <div className="text-[10px] font-mono text-[#94a3b8] uppercase flex items-center justify-between">
            <span>Executed Contracts</span>
            <FileCheck2 className="w-3.5 h-3.5 text-[#38bdf8]" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {documents.filter((d) => d.category === 'SIGNED_CONTRACT').length}
          </div>
          <div className="text-[10px] text-[#4edea3] font-mono mt-0.5">
            Active Binding Agreements
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#222a3d]">
          <div className="text-[10px] font-mono text-[#94a3b8] uppercase flex items-center justify-between">
            <span>Accuracy Bond</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#4edea3]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#4edea3] mt-1">
            $10,000 Bond
          </div>
          <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5">
            Max 0.5% Variance SLA
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-[#131b2e] border border-[#222a3d] flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by file name, doc ID, or scope..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0b1326] border border-[#222a3d] rounded-lg pl-9 pr-3 py-2 text-white placeholder-[#64748b] focus:outline-none focus:border-[#38bdf8]"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-[#94a3b8]">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#0b1326] border border-[#222a3d] rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-[#38bdf8]"
          >
            <option value="ALL">All Categories</option>
            <option value="DELIVERABLE">Project Deliverables (QTO)</option>
            <option value="SIGNED_CONTRACT">Signed Contracts</option>
            <option value="ACCURACY_CERTIFICATE">Accuracy Certificates</option>
            <option value="BIM_REPORT">BIM &amp; Clash Audits</option>
          </select>

          <button
            onClick={loadDocuments}
            title="Refresh repository via Mock File Service"
            className="p-1.5 rounded-lg bg-[#0b1326] hover:bg-[#1e293b] border border-[#222a3d] text-[#94a3b8] hover:text-white cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#38bdf8]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Document List Table / Card View */}
      {isLoading ? (
        <div className="p-12 text-center text-xs font-mono text-[#94a3b8] bg-[#131b2e] rounded-xl border border-[#222a3d]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#38bdf8] mb-2" />
          <span>Synchronizing with Mock File Service Repository...</span>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="p-12 text-center text-xs font-mono text-[#94a3b8] bg-[#131b2e] rounded-xl border border-[#222a3d]">
          <AlertCircle className="w-6 h-6 mx-auto text-[#e0b44a] mb-2" />
          <span>No documents found matching the selected filter criteria.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredDocuments.map((doc) => {
            const isContract = doc.category === 'SIGNED_CONTRACT';
            const isQto = doc.category === 'DELIVERABLE';

            return (
              <div
                key={doc.id}
                className="p-4 sm:p-5 rounded-xl bg-[#131b2e] border border-[#222a3d] hover:border-[#38bdf8]/40 transition-all shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* File Icon & Core Details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold border ${
                      doc.fileName.endsWith('.xlsx')
                        ? 'bg-[#107c41]/15 text-[#4edea3] border-[#107c41]/40'
                        : isContract
                        ? 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/40'
                        : 'bg-[#ef4444]/15 text-[#f87171] border-[#ef4444]/40'
                    }`}
                  >
                    {doc.fileName.endsWith('.xlsx') ? (
                      <FileSpreadsheet className="w-6 h-6" />
                    ) : isContract ? (
                      <FileCheck2 className="w-6 h-6" />
                    ) : (
                      <FileText className="w-6 h-6" />
                    )}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                      <span className="font-bold text-white hover:underline cursor-pointer" onClick={() => setInspectingDoc(doc)}>
                        {doc.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isContract
                            ? 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30'
                            : isQto
                            ? 'bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30'
                            : 'bg-[#e0b44a]/15 text-[#e0b44a] border border-[#e0b44a]/30'
                        }`}
                      >
                        {doc.categoryLabel}
                      </span>
                      <span className="text-[10px] text-[#94a3b8] font-mono">
                        {doc.version}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-[#94a3b8] flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium">{doc.fileName}</span>
                      <span>&bull;</span>
                      <span>{doc.fileSize}</span>
                      <span>&bull;</span>
                      <span>Project: <strong className="text-white">{doc.projectTitle}</strong></span>
                    </div>

                    {/* Metadata Subline */}
                    <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-[#94a3b8] flex-wrap">
                      {isContract && doc.signerName && (
                        <span className="text-[#38bdf8] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#4edea3]" />
                          Signer: {doc.signerName} ({doc.signerEmail})
                        </span>
                      )}
                      {doc.auditSignoff && (
                        <span className="text-[#4edea3] flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          {doc.auditSignoff}
                        </span>
                      )}
                      <span>&bull;</span>
                      <span className="truncate max-w-xs text-[#64748b]">
                        SHA-256: {doc.sha256Hash.substring(0, 16)}...
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Actions: Inspect & Download Button */}
                <div className="flex items-center gap-2.5 font-mono text-xs w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-[#222a3d]">
                  <button
                    onClick={() => setInspectingDoc(doc)}
                    className="px-3 py-2 rounded-lg bg-[#0b1326] hover:bg-[#1e293b] border border-[#222a3d] text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Audit Details</span>
                  </button>

                  <button
                    onClick={() => handleDownload(doc)}
                    className="px-4 py-2 rounded-lg bg-[#4edea3] hover:bg-[#3ec490] text-[#0b1326] font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                    {doc.downloadCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-[#0b1326]/20 rounded-full">
                        {doc.downloadCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UPLOAD SIGNED CONTRACT PDF */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#131b2e] border border-[#334155] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-[#dae2fd]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/15 border border-[#38bdf8]/30 flex items-center justify-center text-[#38bdf8]">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Upload Signed Contract PDF
                  </h3>
                  <p className="text-xs text-[#94a3b8]">
                    Transmits directly to Mock File Service with automated SHA-256 seal &amp; audit logging
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#1f283d] text-[#94a3b8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleContractSubmit} className="p-5 sm:p-6 space-y-4 bg-[#0b1326] text-xs">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
                  uploadFile
                    ? 'border-[#4edea3] bg-[#4edea3]/5'
                    : 'border-[#334155] hover:border-[#38bdf8] bg-[#131b2e]'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                />

                {uploadFile ? (
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-full bg-[#4edea3]/20 text-[#4edea3] mx-auto flex items-center justify-center">
                      <FileCheck2 className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-white text-sm">{uploadFile.name}</div>
                    <div className="text-[11px] font-mono text-[#94a3b8]">
                      {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB &bull; PDF Document Ready for Ingestion
                    </div>
                    <span className="text-[10px] text-[#38bdf8] hover:underline block pt-1">
                      Click to choose a different PDF
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <FileUp className="w-9 h-9 text-[#38bdf8] mx-auto" />
                    <div className="font-bold text-white text-sm">
                      Drag and drop signed contract PDF here, or click to browse
                    </div>
                    <div className="text-[11px] text-[#94a3b8]">
                      Accepts executed Master Service Agreements, Subcontracts, or Work Orders (.pdf only)
                    </div>
                  </div>
                )}
              </div>

              {/* Project & Scope Association */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-white font-bold">Target Project</label>
                  <select
                    value={uploadProjectId}
                    onChange={(e) => setUploadProjectId(e.target.value)}
                    className="w-full bg-[#131b2e] border border-[#222a3d] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#38bdf8]"
                  >
                    {displayedProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-white font-bold">Agreed Scope Total ($ USD)</label>
                  <input
                    type="number"
                    value={contractValue}
                    onChange={(e) => setContractValue(Number(e.target.value))}
                    className="w-full bg-[#131b2e] border border-[#222a3d] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#38bdf8] font-mono"
                  />
                </div>
              </div>

              {/* Authorized Signer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-white font-bold">Authorized Signer Name</label>
                  <input
                    type="text"
                    required
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="e.g. David Sterling"
                    className="w-full bg-[#131b2e] border border-[#222a3d] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#38bdf8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-white font-bold">Signer Corporate Email</label>
                  <input
                    type="email"
                    required
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    placeholder="e.g. d.sterling@turnerconstruction.com"
                    className="w-full bg-[#131b2e] border border-[#222a3d] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#38bdf8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-white font-bold">Signer Title</label>
                  <input
                    type="text"
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    placeholder="e.g. Project Executive"
                    className="w-full bg-[#131b2e] border border-[#222a3d] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#38bdf8]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-white font-bold">Special Terms / Execution Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Countersigned with Addendum 3 included. Net 30 milestone billing schedule acknowledged."
                  className="w-full bg-[#131b2e] border border-[#222a3d] rounded-lg p-2.5 text-white placeholder-[#64748b] focus:outline-none focus:border-[#38bdf8]"
                />
              </div>

              {/* Compliance & Accuracy Clause Notice */}
              <div className="p-3 rounded-lg bg-[#131b2e] border border-[#222a3d] flex items-center gap-2.5 text-[11px] text-[#94a3b8] font-mono">
                <ShieldCheck className="w-5 h-5 text-[#4edea3] flex-shrink-0" />
                <span>
                  By uploading this signed document, you certify authorization under ESIGN/UETA standards.
                  All quantities covered by Bid Exact remain under the $10,000 / 0.5% variance bonded warranty.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-[#222a3d] flex items-center justify-between">
                <span className="text-[10px] text-[#94a3b8] font-mono">
                  Mock File Service &bull; Immediate local sync
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-3.5 py-2 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-xs font-mono text-[#94a3b8] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!uploadFile || isUploading}
                    className="px-4 py-2 rounded-lg bg-[#38bdf8] hover:bg-[#0284c7] disabled:bg-[#1e293b] disabled:text-[#64748b] text-[#0b1326] font-bold font-mono text-xs flex items-center gap-1.5 cursor-pointer shadow transition-all"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying &amp; Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Submit Signed Contract</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DOCUMENT INSPECTOR & CRYPTOGRAPHIC VERIFICATION */}
      {/* ========================================================================= */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#131b2e] border border-[#334155] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-[#dae2fd]">
            <div className="p-5 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4edea3]/15 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#4edea3]">
                      {inspectingDoc.id}
                    </span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-[#38bdf8]/20 text-[#38bdf8] uppercase">
                      {inspectingDoc.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {inspectingDoc.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="p-1.5 rounded-lg hover:bg-[#1f283d] text-[#94a3b8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 bg-[#0b1326] text-xs font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-[#131b2e] border border-[#222a3d]">
                  <div className="text-[10px] text-[#94a3b8] uppercase">File Name</div>
                  <div className="text-xs font-bold text-white truncate mt-0.5" title={inspectingDoc.fileName}>
                    {inspectingDoc.fileName}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#131b2e] border border-[#222a3d]">
                  <div className="text-[10px] text-[#94a3b8] uppercase">File Size</div>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {inspectingDoc.fileSize}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#131b2e] border border-[#222a3d]">
                  <div className="text-[10px] text-[#94a3b8] uppercase">Category</div>
                  <div className="text-xs font-bold text-[#38bdf8] mt-0.5">
                    {inspectingDoc.categoryLabel}
                  </div>
                </div>
              </div>

              {/* Cryptographic SHA-256 Box */}
              <div className="p-3.5 rounded-lg bg-[#131b2e] border border-[#222a3d] space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white font-bold">SHA-256 Cryptographic Hash</span>
                  <span className="text-[#4edea3] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> MATCHES BLOCKCHAIN PROOF
                  </span>
                </div>
                <div className="p-2 rounded bg-[#0b1326] text-[#4edea3] text-[11px] break-all border border-[#222a3d]">
                  {inspectingDoc.sha256Hash}
                </div>
              </div>

              {/* Signer or Peer Audit Details */}
              <div className="p-3.5 rounded-lg bg-[#131b2e] border border-[#222a3d] space-y-2">
                <div className="text-[10px] uppercase text-[#94a3b8] font-bold">
                  Verification &amp; Governance Details
                </div>
                <div className="space-y-1 text-xs">
                  {inspectingDoc.signerName && (
                    <div>
                      Authorized Signer: <strong className="text-white">{inspectingDoc.signerName}</strong> &lt;{inspectingDoc.signerEmail}&gt;
                    </div>
                  )}
                  {inspectingDoc.signedAt && (
                    <div>
                      Timestamp of Signature: <strong className="text-white">{inspectingDoc.signedAt}</strong>
                    </div>
                  )}
                  {inspectingDoc.auditSignoff && (
                    <div>
                      Auditor Peer Sign-off: <strong className="text-[#4edea3]">{inspectingDoc.auditSignoff}</strong>
                    </div>
                  )}
                  {inspectingDoc.notes && (
                    <div className="text-[#bbcabf] font-sans pt-1">
                      {inspectingDoc.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#222a3d] flex items-center justify-between bg-[#0b1326] font-mono text-xs">
              <span className="text-[#94a3b8]">
                Downloads logged: <strong className="text-white">{inspectingDoc.downloadCount || 0}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectingDoc(null)}
                  className="px-3.5 py-2 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] hover:text-white cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDownload(inspectingDoc);
                    setInspectingDoc(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#4edea3] hover:bg-[#3ec490] text-[#0b1326] font-bold flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
