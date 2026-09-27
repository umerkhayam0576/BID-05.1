/**
 * Mock File Service for Client Portal & Document Management
 * Provides file storage, hashing, download generation, and signed contract verification.
 */

export interface ManagedDocument {
  id: string;
  projectId: string;
  projectTitle: string;
  clientId: string;
  clientName: string;
  name: string;
  fileName: string;
  fileSize: string;
  fileSizeBytes: number;
  mimeType: string;
  category: 'DELIVERABLE' | 'SIGNED_CONTRACT' | 'ACCURACY_CERTIFICATE' | 'BIM_REPORT' | 'ADDENDUM';
  categoryLabel: string;
  version: string;
  uploadedAt: string;
  uploadedBy: string;
  signerName?: string;
  signerEmail?: string;
  signerIp?: string;
  signedAt?: string;
  sha256Hash: string;
  status: 'VERIFIED' | 'PENDING_AUDIT' | 'ACTIVE_CONTRACT' | 'SUPERSEDED';
  isDownloadable: boolean;
  downloadCount: number;
  auditSignoff?: string;
  downloadUrl?: string;
  contractTerms?: {
    scopeTotal: number;
    depositAmount: number;
    depositStatus: 'PAID' | 'PENDING' | 'WAIVED';
    effectiveDate: string;
    completionDate: string;
  };
  notes?: string;
}

// In-memory persistent mock storage initialized with standard records
let storedDocuments: ManagedDocument[] = [
  {
    id: 'DOC-2024-DEL-01',
    projectId: 'BID-2024-884',
    projectTitle: 'Metro Heights Tower - Core & Shell',
    clientId: 'client-1',
    clientName: 'Turner Construction',
    name: 'Master Architectural & Structural Dual QTO Takeoff',
    fileName: 'Turner_Construction_MetroHeights_Final_Takeoff_Master.xlsx',
    fileSize: '34.8 MB',
    fileSizeBytes: 36490444,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    category: 'DELIVERABLE',
    categoryLabel: 'Project Deliverable',
    version: 'v2.1 Final',
    uploadedAt: '2024-09-18 14:22:00',
    uploadedBy: 'Marcus Vance (Senior Lead Auditor)',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    status: 'VERIFIED',
    isDownloadable: true,
    downloadCount: 7,
    auditSignoff: 'Marcus Vance & Umer Farooq (Dual QA Passed)',
    notes: 'Dual-audited QTO package covering CSI 03 20 00 (Rebar), 03 30 00 (Cast-in-Place), and 05 12 00 (Structural Framing).'
  },
  {
    id: 'DOC-2024-DEL-02',
    projectId: 'BID-2024-884',
    projectTitle: 'Metro Heights Tower - Core & Shell',
    clientId: 'client-1',
    clientName: 'Turner Construction',
    name: '$10,000 Zero-Variance Bonded Accuracy Certificate',
    fileName: 'BidExact_10k_Accuracy_Guarantee_Certificate_MetroHeights.pdf',
    fileSize: '2.4 MB',
    fileSizeBytes: 2516582,
    mimeType: 'application/pdf',
    category: 'ACCURACY_CERTIFICATE',
    categoryLabel: 'Accuracy Guarantee',
    version: 'v1.0 Executed',
    uploadedAt: '2024-09-18 15:45:00',
    uploadedBy: 'Syed Ahmed (Managing Partner)',
    sha256Hash: 'a7c93e4492da6f149bfbf4c8996fb92427ae41e4649b934ca495991b78521199',
    status: 'VERIFIED',
    isDownloadable: true,
    downloadCount: 4,
    auditSignoff: 'Legal & Executive QA Signoff',
    notes: 'Zero variance bonded warranty coverage up to $10,000 for any QTO variance > 0.5% against IFC drawings.'
  },
  {
    id: 'DOC-2024-DEL-03',
    projectId: 'BID-2024-884',
    projectTitle: 'Metro Heights Tower - Core & Shell',
    clientId: 'client-1',
    clientName: 'Turner Construction',
    name: 'BIM LOD 350 Clash Resolution & MEP Penetration Audit',
    fileName: 'MetroHeights_LOD350_Clash_Audit_Report.pdf',
    fileSize: '19.1 MB',
    fileSizeBytes: 20027801,
    mimeType: 'application/pdf',
    category: 'BIM_REPORT',
    categoryLabel: 'BIM & Clash Audit',
    version: 'v3.0 Final',
    uploadedAt: '2024-09-17 11:30:00',
    uploadedBy: 'Elena Rostova (BIM Lead)',
    sha256Hash: 'b5f2c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852c001',
    status: 'VERIFIED',
    isDownloadable: true,
    downloadCount: 3,
    auditSignoff: 'Elena Rostova (BIM Quality Assurance)',
    notes: 'Navisworks federated clash detection matrix showing 0 active clash interferences in shear walls and elevator shafts.'
  },
  {
    id: 'DOC-2024-CON-01',
    projectId: 'BID-2024-884',
    projectTitle: 'Metro Heights Tower - Core & Shell',
    clientId: 'client-1',
    clientName: 'Turner Construction',
    name: 'Executed Pre-Construction Master Agreement & Scope Order',
    fileName: 'Turner_Construction_Executed_Agreement_QTE-2024-041.pdf',
    fileSize: '4.8 MB',
    fileSizeBytes: 5033164,
    mimeType: 'application/pdf',
    category: 'SIGNED_CONTRACT',
    categoryLabel: 'Signed Contract',
    version: 'Signed & Sealed',
    uploadedAt: '2024-09-16 09:15:00',
    uploadedBy: 'Client Portal (Authorized Signer)',
    signerName: 'David Sterling',
    signerEmail: 'd.sterling@turnerconstruction.com',
    signerIp: '198.51.100.44',
    signedAt: '2024-09-16 09:14:12 EST',
    sha256Hash: '98d7f4a289b1c149afbf4c8996fb92427ae41e4649b934ca495991b7852f4182',
    status: 'ACTIVE_CONTRACT',
    isDownloadable: true,
    downloadCount: 5,
    auditSignoff: 'Legal Compliance Verified',
    contractTerms: {
      scopeTotal: 82327,
      depositAmount: 20581.75,
      depositStatus: 'PAID',
      effectiveDate: '2024-09-16',
      completionDate: '2024-10-15',
    },
    notes: 'Includes standard Master Pre-Con SLA terms, $10K accuracy clause, and Net 30 final milestone billing schedule.'
  }
];

// Helper to calculate mock SHA-256 string
function generateMockSha256(seed: string): string {
  let hash = '';
  const hex = '0123456789abcdef';
  for (let i = 0; i < 64; i++) {
    const code = (seed.charCodeAt(i % seed.length) + i * 13) % 16;
    hash += hex[code];
  }
  return hash;
}

export const MockFileService = {
  /**
   * Retrieve all documents or filter by client/project
   */
  async getDocuments(filter?: { clientId?: string; projectId?: string; category?: string }): Promise<ManagedDocument[]> {
    // Simulate slight network roundtrip
    await new Promise((resolve) => setTimeout(resolve, 80));
    
    let docs = [...storedDocuments];
    if (filter?.clientId) {
      docs = docs.filter(
        (d) =>
          d.clientId.toLowerCase() === filter.clientId!.toLowerCase() ||
          d.clientName.toLowerCase().includes(filter.clientId!.toLowerCase())
      );
    }
    if (filter?.projectId) {
      docs = docs.filter((d) => d.projectId === filter.projectId);
    }
    if (filter?.category && filter.category !== 'ALL') {
      docs = docs.filter((d) => d.category === filter.category);
    }
    return docs;
  },

  /**
   * Upload signed contract PDF from Project Owner
   */
  async uploadSignedContract(params: {
    projectId: string;
    projectTitle: string;
    clientId: string;
    clientName: string;
    file: File | { name: string; size: number; type: string };
    signerName: string;
    signerEmail: string;
    signerTitle?: string;
    contractScopeValue?: number;
    depositPaid?: boolean;
    notes?: string;
  }): Promise<ManagedDocument> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const hash = generateMockSha256(`${params.file.name}_${Date.now()}_${params.signerEmail}`);
    const sizeMb = (params.file.size / (1024 * 1024)).toFixed(1);

    const newDoc: ManagedDocument = {
      id: `DOC-${new Date().getFullYear()}-CON-${Math.floor(100 + Math.random() * 900)}`,
      projectId: params.projectId,
      projectTitle: params.projectTitle,
      clientId: params.clientId,
      clientName: params.clientName,
      name: `Signed Contract: ${params.file.name.replace(/\.[^/.]+$/, '')}`,
      fileName: params.file.name,
      fileSize: `${sizeMb} MB`,
      fileSizeBytes: params.file.size,
      mimeType: params.file.type || 'application/pdf',
      category: 'SIGNED_CONTRACT',
      categoryLabel: 'Signed Contract',
      version: 'v1.0 Executed & Countersigned',
      uploadedAt: timestamp,
      uploadedBy: `${params.signerName} (${params.signerTitle || 'Project Owner / GC'})`,
      signerName: params.signerName,
      signerEmail: params.signerEmail,
      signerIp: '198.51.100.' + Math.floor(10 + Math.random() * 80),
      signedAt: `${timestamp} UTC`,
      sha256Hash: hash,
      status: 'ACTIVE_CONTRACT',
      isDownloadable: true,
      downloadCount: 1,
      auditSignoff: 'Verified Electronic Signature (ESIGN & UETA Compliant)',
      contractTerms: {
        scopeTotal: params.contractScopeValue || 82327,
        depositAmount: (params.contractScopeValue || 82327) * 0.25,
        depositStatus: params.depositPaid ? 'PAID' : 'PENDING',
        effectiveDate: timestamp.split(' ')[0],
        completionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      notes: params.notes || 'Executed agreement uploaded via Client Portal gateway.',
    };

    // Prepend to storage
    storedDocuments = [newDoc, ...storedDocuments];
    return newDoc;
  },

  /**
   * Upload / Publish a new project deliverable (e.g. from estimating team)
   */
  async uploadDeliverable(params: {
    projectId: string;
    projectTitle: string;
    clientId: string;
    clientName: string;
    name: string;
    fileName: string;
    fileSize: string;
    category: 'DELIVERABLE' | 'ACCURACY_CERTIFICATE' | 'BIM_REPORT';
    auditorSignoff: string;
    notes?: string;
  }): Promise<ManagedDocument> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const hash = generateMockSha256(`${params.fileName}_${Date.now()}`);

    const newDoc: ManagedDocument = {
      id: `DOC-${new Date().getFullYear()}-DEL-${Math.floor(100 + Math.random() * 900)}`,
      projectId: params.projectId,
      projectTitle: params.projectTitle,
      clientId: params.clientId,
      clientName: params.clientName,
      name: params.name,
      fileName: params.fileName,
      fileSize: params.fileSize,
      fileSizeBytes: 15000000,
      mimeType: params.fileName.endsWith('.xlsx')
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf',
      category: params.category,
      categoryLabel:
        params.category === 'DELIVERABLE'
          ? 'Project Deliverable'
          : params.category === 'ACCURACY_CERTIFICATE'
          ? 'Accuracy Guarantee'
          : 'BIM & Clash Audit',
      version: 'v1.0 QA Approved',
      uploadedAt: timestamp,
      uploadedBy: params.auditorSignoff,
      sha256Hash: hash,
      status: 'VERIFIED',
      isDownloadable: true,
      downloadCount: 0,
      auditSignoff: params.auditorSignoff,
      notes: params.notes,
    };

    storedDocuments = [newDoc, ...storedDocuments];
    return newDoc;
  },

  /**
   * Download a managed document and trigger a real browser file download
   */
  downloadDocument(doc: ManagedDocument, authorizedUser: string): { fileName: string; hash: string } {
    // Increment download count
    doc.downloadCount = (doc.downloadCount || 0) + 1;

    // Generate formatted content simulating the binary or structured payload
    const textContent = `========================================================================================
BID EXACT LLC - SECURE DOCUMENT MANAGEMENT REPOSITORY
========================================================================================
Document Title:    ${doc.name}
Document ID:       ${doc.id}
File Name:         ${doc.fileName}
Category:          ${doc.categoryLabel} (${doc.category})
Version:           ${doc.version}
File Size:         ${doc.fileSize}
Target Project:    ${doc.projectTitle} [ID: ${doc.projectId}]
Authorized Client: ${doc.clientName}
Downloaded By:     ${authorizedUser}
Timestamp:         ${new Date().toISOString()}

SECURITY & INTEGRITY SPECIFICATIONS:
----------------------------------------------------------------------------------------
SHA-256 Checksum:  ${doc.sha256Hash}
Verification:      ${doc.status}
Audit Signoff:     ${doc.auditSignoff || 'QA Certified'}
${doc.signerName ? `Signer Name:       ${doc.signerName} <${doc.signerEmail}>\nSigner Timestamp:  ${doc.signedAt}\nIP Signature Proof: ${doc.signerIp}` : ''}
${doc.contractTerms ? `Contract Scope:    $${doc.contractTerms.scopeTotal.toLocaleString()} USD\nMobilization:      $${doc.contractTerms.depositAmount.toLocaleString()} (${doc.contractTerms.depositStatus})` : ''}

GUARANTEE & BOND CLAUSE:
----------------------------------------------------------------------------------------
All takeoff items contained within Bid Exact certified packages carry a bonded guarantee
up to $10,000 for any itemized variance exceeding 0.5% tolerance.
========================================================================================
[END OF SECURE ENCRYPTED FILE TRANSMISSION HEADER]`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.fileName.endsWith('.pdf') || doc.fileName.endsWith('.xlsx')
      ? doc.fileName.replace(/\.(pdf|xlsx)$/, '_Verified_Package.txt')
      : `${doc.fileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      fileName: doc.fileName,
      hash: doc.sha256Hash,
    };
  }
};
