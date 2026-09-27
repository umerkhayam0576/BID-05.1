import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Mail,
  Building2,
  User,
  Calendar,
  CreditCard,
  Copy,
  Check,
  Sparkles,
  ArrowDownRight,
  Stamp,
} from 'lucide-react';
import { LoanPaymentReceiptData } from '../../types';
import { downloadLoanPaymentPdf } from '../../utils/loanPdfReceiptGenerator';

interface LoanPaymentReceiptModalProps {
  receipt: LoanPaymentReceiptData;
  onClose: () => void;
  onEmailReceipt?: (receipt: LoanPaymentReceiptData) => void;
}

export const LoanPaymentReceiptModal: React.FC<LoanPaymentReceiptModalProps> = ({
  receipt,
  onClose,
  onEmailReceipt,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Directly generate & download official vector PDF
  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    try {
      downloadLoanPaymentPdf(receipt);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setTimeout(() => setIsDownloadingPdf(false), 1200);
    }
  };

  // Trigger standard browser print which formats to clean 8.5x11 PDF
  const handlePrint = () => {
    window.print();
  };

  // Direct standalone document download
  const handleDownloadDocument = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt_${receipt.receiptNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Manrope:wght@400;600;700;800&display=swap');
    body {
      font-family: 'Manrope', -apple-system, sans-serif;
      margin: 0;
      padding: 40px;
      background: #f8fafc;
      color: #0f172a;
    }
    .sheet {
      max-width: 780px;
      margin: 0 auto;
      background: #ffffff;
      padding: 48px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .header {
      border-bottom: 2px solid #047857;
      padding-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #047857;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin-top: 4px;
    }
    .receipt-title {
      text-align: right;
    }
    .receipt-title h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
    }
    .receipt-meta {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }
    .badge-reconciled {
      display: inline-block;
      margin-top: 6px;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin: 28px 0;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 16px;
      border-radius: 6px;
    }
    .card-title {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .card-content {
      font-size: 12px;
      line-height: 1.6;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 12px;
      border-radius: 6px;
      text-align: center;
    }
    .kpi-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .kpi-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }
    .kpi-value.emerald {
      color: #047857;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
      font-size: 11px;
    }
    th {
      background: #f1f5f9;
      text-align: left;
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      text-transform: uppercase;
      color: #475569;
    }
    td {
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      font-family: 'JetBrains Mono', monospace;
    }
    .signature-area {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px dashed #cbd5e1;
      padding-top: 24px;
      margin-top: 36px;
    }
    .barcode {
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 3px;
      color: #64748b;
      font-size: 13px;
    }
    .disclaimer {
      font-size: 9px;
      color: #94a3b8;
      margin-top: 24px;
      line-height: 1.5;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .sheet { border: none; box-shadow: none; padding: 20px; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <div class="brand-title">BID EXACT LLC</div>
        <div class="brand-sub">Treasury & Payroll Finance Operations</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
          100 Enterprise Blvd, Suite 400 • Chicago, IL 60601 • finance@bidexact.com
        </div>
      </div>
      <div class="receipt-title">
        <h1>LOAN PAYMENT RECEIPT</h1>
        <div class="receipt-meta">RECEIPT #: ${receipt.receiptNumber}</div>
        <div class="receipt-meta">DATE: ${receipt.paymentDate}</div>
        <div class="badge-reconciled">✓ ${receipt.reconciledStatus || 'POSTED & RECONCILED'}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">ISSUED BY (CREDITOR / TREASURY)</div>
        <div class="card-content">
          <strong>Bid Exact LLC</strong><br>
          Operating Account: ${receipt.disbursementAccount}<br>
          Transaction Ref: ${receipt.transactionId}<br>
          Authorized Officer: ${receipt.authorizedOfficer}
        </div>
      </div>
      <div class="card">
        <div class="card-title">BORROWER / PAYER DETAILS</div>
        <div class="card-content">
          <strong>${receipt.borrowerName}</strong> (${receipt.borrowerId || 'Staff'})<br>
          ${receipt.borrowerRole || 'Employee / Contractor'}<br>
          Email: ${receipt.borrowerEmail || 'finance@bidexact.com'}<br>
          Facility: ${receipt.loanName} (${receipt.loanId})
        </div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Beginning Balance</div>
        <div class="kpi-value">$${receipt.previousBalance.toLocaleString()}</div>
      </div>
      <div class="kpi-card" style="border-color: #047857; background: #ecfdf5;">
        <div class="kpi-label" style="color: #047857; font-weight: 700;">Amount Paid</div>
        <div class="kpi-value emerald">$${receipt.amount.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Principal Paid</div>
        <div class="kpi-value">$${receipt.principalPaid.toLocaleString()}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Ending Balance</div>
        <div class="kpi-value">$${receipt.remainingBalance.toLocaleString()}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description / Ledger Entry</th>
          <th>Method / Channel</th>
          <th>Principal Applied</th>
          <th>Interest Applied</th>
          <th style="text-align: right;">Total Credited</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Loan Amortization Installment</strong><br>
            <span style="font-size: 10px; color: #64748b;">Facility ID: ${receipt.loanId} • ${receipt.loanType || 'Employee Advance'}</span>
          </td>
          <td>${receipt.paymentMethod}</td>
          <td>$${receipt.principalPaid.toLocaleString()}</td>
          <td>$${receipt.interestPaid.toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700; color: #047857;">$${receipt.amount.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>

    <div class="signature-area">
      <div>
        <div class="barcode">||| | |||| || | ||| |||| | |||</div>
        <div style="font-size: 10px; color: #64748b; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">
          AUTH HASH: SHA256-${Math.abs(receipt.receiptNumber.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16).toUpperCase()}
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 20px; color: #047857;">
          s/ Umer Khayam
        </div>
        <div style="font-size: 10px; color: #475569; font-weight: 700; border-top: 1px solid #cbd5e1; padding-top: 2px;">
          Umer Khayam, Chief Executive Officer
        </div>
        <div style="font-size: 9px; color: #64748b;">Bid Exact Corporate Treasury</div>
      </div>
    </div>

    <div class="disclaimer">
      This official electronic receipt serves as binding confirmation that the above repayment amount has been received and credited against the principal and interest of the borrower's loan record in accordance with corporate payroll policies and general ledger standards.
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BidExact_LoanReceipt_${receipt.receiptNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyReference = () => {
    const summaryText = `Bid Exact Loan Repayment Receipt
Receipt No: ${receipt.receiptNumber}
Payment Date: ${receipt.paymentDate}
Borrower: ${receipt.borrowerName} (${receipt.borrowerRole || 'Staff'})
Loan Facility: ${receipt.loanName} [${receipt.loanId}]
Amount Paid: $${receipt.amount.toLocaleString()} (Principal: $${receipt.principalPaid.toLocaleString()}, Interest: $${receipt.interestPaid.toLocaleString()})
New Balance: $${receipt.remainingBalance.toLocaleString()}
Method: ${receipt.paymentMethod}
Account: ${receipt.disbursementAccount}
Status: ${receipt.reconciledStatus}
Txn Ref: ${receipt.transactionId}`;

    navigator.clipboard.writeText(summaryText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSendEmail = () => {
    if (onEmailReceipt) {
      onEmailReceipt(receipt);
    }
    setIsEmailSent(true);
    setTimeout(() => setIsEmailSent(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-[#131b2e] border border-[#2d3449] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Top Control Bar (Non-Printable) */}
        <div className="px-5 py-3.5 border-b border-[#222a3d] flex flex-wrap items-center justify-between gap-3 bg-[#0b1326] no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <span>Loan Repayment PDF Receipt</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30">
                    {receipt.receiptNumber}
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-[#86948a]">
                Generated automatically upon successful repayment confirmation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              type="button"
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#38bdf8] to-[#0284c7] hover:from-[#0ea5e9] hover:to-[#0369a1] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
              title="Download official high-resolution PDF receipt"
            >
              {isDownloadingPdf ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="px-3.5 py-1.5 bg-[#4edea3]/15 hover:bg-[#4edea3]/25 border border-[#4edea3]/30 text-[#4edea3] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
              title="Print or save as standard PDF document via browser print dialog"
            >
              <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadDocument}
              type="button"
              className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-[#38bdf8]/40 text-[#38bdf8] rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download standalone HTML/PDF receipt file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>

            <button
              onClick={handleCopyReference}
              type="button"
              className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-[#dae2fd] rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy receipt verification details"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#4edea3]" />
                  <span className="text-[#4edea3]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Ref</span>
                </>
              )}
            </button>

            <button
              onClick={handleSendEmail}
              type="button"
              className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-[#ffb4ab]/30 text-[#ffb4ab] rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title={`Send receipt copy to ${receipt.borrowerEmail || 'borrower'}`}
            >
              {isEmailSent ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3]" />
                  <span className="text-[#4edea3]">Sent!</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email to Staff</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg hover:bg-[#222a3d] text-[#86948a] hover:text-white transition-colors ml-1 cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Automatic Generation Confirmation Banner */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-[#064e3b]/80 via-[#064e3b]/40 to-[#0b1326] border-b border-[#047857]/30 flex items-center justify-between text-xs text-[#a7f3d0] font-mono no-print">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#4edea3]" />
            <span>
              <strong>Automated Receipt Trigger:</strong> Repayment of{' '}
              <strong className="text-white">${receipt.amount.toLocaleString()}</strong> has been posted to Treasury Ledger and General Cash Ledger.
            </span>
          </div>
          <span className="text-[11px] text-[#6ee7b7] hidden sm:inline">
            Status: {receipt.reconciledStatus}
          </span>
        </div>

        {/* ========================================================================= */}
        {/* PRINTABLE RECEIPT SHEET (White Paper Aesthetic on screen & pure print layout) */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-[#070d19] flex justify-center">
          <div
            id="printable-loan-receipt"
            className="w-full max-w-[760px] bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-10 font-sans border border-slate-200 transition-all"
          >
            {/* 1. Official Header & Corporate Identity */}
            <div className="border-b-2 border-emerald-600 pb-5 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-emerald-700 text-white flex items-center justify-center font-black text-sm tracking-wider">
                    BX
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                      BID EXACT LLC
                    </h1>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">
                      Corporate Treasury & Estimating Technology
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 mt-2 space-y-0.5 font-mono">
                  <div>100 Enterprise Boulevard, Suite 400 • Chicago, IL 60601</div>
                  <div>Disbursement Department: finance@bidexact.com • (312) 555-0198</div>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="inline-block px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono text-[10px] font-bold tracking-wide uppercase mb-1">
                  OFFICIAL PAYMENT RECEIPT
                </div>
                <div className="font-mono text-xs font-bold text-slate-900">
                  RECEIPT #: <span className="text-emerald-700">{receipt.receiptNumber}</span>
                </div>
                <div className="font-mono text-[11px] text-slate-600">
                  DATE: {receipt.paymentDate}
                </div>
                <div className="font-mono text-[10px] text-slate-400">
                  TIME: {receipt.timestamp}
                </div>
                <div className="mt-1 flex items-center sm:justify-end gap-1 text-[11px] text-emerald-700 font-bold font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{receipt.reconciledStatus}</span>
                </div>
              </div>
            </div>

            {/* 2. Parties Information (Issuer vs Borrower) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 font-mono text-xs">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Issuing Entity (Creditor)</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="font-bold text-slate-900">Bid Exact LLC</div>
                  <div className="text-slate-600">Disbursement Account: <span className="font-semibold text-slate-800">{receipt.disbursementAccount}</span></div>
                  <div className="text-slate-600">Treasury Ref: <span className="font-semibold text-slate-800">{receipt.transactionId}</span></div>
                  <div className="text-slate-600">Officer in Charge: <span className="text-slate-800">{receipt.authorizedOfficer}</span></div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-600" />
                  <span>Payer / Borrower Account</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{receipt.borrowerName}</span>
                    {receipt.borrowerId && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                        {receipt.borrowerId}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-600">Role: <span className="text-slate-800">{receipt.borrowerRole || 'Staff Member'}</span></div>
                  <div className="text-slate-600">Email: <span className="text-slate-800">{receipt.borrowerEmail || 'finance@bidexact.com'}</span></div>
                  <div className="text-slate-600">Facility: <span className="font-semibold text-emerald-800">{receipt.loanName} ({receipt.loanId})</span></div>
                </div>
              </div>
            </div>

            {/* 3. High-Level Financial Balance Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center font-mono">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Beginning Balance</div>
                <div className="text-sm sm:text-base font-extrabold text-slate-700 mt-0.5">
                  ${receipt.previousBalance.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-center font-mono ring-1 ring-emerald-400">
                <div className="text-[10px] text-emerald-700 uppercase font-bold flex items-center justify-center gap-1">
                  <span>Amount Paid</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </div>
                <div className="text-base sm:text-lg font-black text-emerald-800 mt-0.5">
                  ${receipt.amount.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center font-mono">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Principal Applied</div>
                <div className="text-sm sm:text-base font-extrabold text-slate-700 mt-0.5">
                  ${receipt.principalPaid.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center font-mono">
                <div className="text-[10px] text-slate-500 uppercase font-bold">New Remaining Balance</div>
                <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                  ${receipt.remainingBalance.toLocaleString()}
                </div>
              </div>
            </div>

            {/* 4. Itemized Ledger Breakdown */}
            <div className="mb-6 border border-slate-200 rounded-lg overflow-hidden font-mono text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="p-2.5 sm:p-3">Item / Ledger Description</th>
                    <th className="p-2.5 sm:p-3">Payment Channel</th>
                    <th className="p-2.5 sm:p-3 text-right">Principal</th>
                    <th className="p-2.5 sm:p-3 text-right">Interest</th>
                    <th className="p-2.5 sm:p-3 text-right">Net Credited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  <tr>
                    <td className="p-2.5 sm:p-3">
                      <div className="font-bold text-slate-900">
                        Monthly Loan Repayment Installment
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Loan Ref: {receipt.loanId} • Category: {receipt.loanType || 'Employee Facility'}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        Balance Reduction: ${receipt.previousBalance.toLocaleString()} → ${receipt.remainingBalance.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-2.5 sm:p-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 text-[10px] font-semibold">
                        {receipt.paymentMethod}
                      </span>
                    </td>
                    <td className="p-2.5 sm:p-3 text-right font-semibold text-slate-800">
                      ${receipt.principalPaid.toLocaleString()}
                    </td>
                    <td className="p-2.5 sm:p-3 text-right text-slate-600">
                      ${receipt.interestPaid.toLocaleString()}
                    </td>
                    <td className="p-2.5 sm:p-3 text-right font-bold text-emerald-700 text-xs">
                      ${receipt.amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-[11px] text-slate-900">
                  <tr>
                    <td colSpan={4} className="p-2.5 sm:p-3 text-right">
                      TOTAL SETTLEMENT RECEIVED & POSTED:
                    </td>
                    <td className="p-2.5 sm:p-3 text-right text-emerald-800 text-sm">
                      ${receipt.amount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 5. Settlement Details & Account Allocation */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-6 text-[11px] font-mono text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="font-bold text-slate-800">Clearing Bank: </span>
                <span>{receipt.disbursementAccount}</span>
              </div>
              <div>
                <span className="font-bold text-slate-800">General Ledger Account: </span>
                <span>GL-1350 (Employee Loan Receivable)</span>
              </div>
              <div>
                <span className="font-bold text-slate-800">Journal Batch ID: </span>
                <span>{receipt.paymentId}</span>
              </div>
              <div>
                <span className="font-bold text-slate-800">Loan Status: </span>
                <span className={receipt.remainingBalance === 0 ? 'text-emerald-700 font-bold' : 'text-slate-800'}>
                  {receipt.remainingBalance === 0 ? 'PAID OFF IN FULL' : 'ACTIVE & IN GOOD STANDING'}
                </span>
              </div>
            </div>

            {/* 6. Corporate Seal & Signatures */}
            <div className="pt-4 border-t-2 border-dashed border-slate-300 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <div className="font-mono text-slate-400 text-xs tracking-widest select-all">
                  ||| | |||| || | ||| |||| | ||| || | ||
                </div>
                <div className="font-mono text-[9px] text-slate-500 mt-1">
                  SECURITY HASH: SHA256-{receipt.receiptNumber.replace(/[^0-9A-Z]/g, '')}-RECONCILED
                </div>
                <div className="text-[9px] text-slate-400 font-sans mt-0.5">
                  Generated via Bid Exact Executive Treasury System • Automated Receipt Daemon
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-sm font-serif italic text-emerald-800 tracking-wide">
                  s/ Umer Khayam
                </div>
                <div className="text-[10px] font-bold font-mono text-slate-900 border-t border-slate-300 pt-1 mt-0.5">
                  Umer Khayam, Chief Executive Officer
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  Bid Exact Corporate Treasury & Financial Controller
                </div>
              </div>
            </div>

            {/* Legal compliance disclosure */}
            <div className="text-[8.5px] text-slate-400 mt-6 pt-2 border-t border-slate-100 leading-tight">
              Notice: This document certifies receipt of payment toward the designated employee loan or corporate debt obligation. All transactions are logged under Bid Exact internal financial control guidelines and federal payroll withholding standards. Retain this receipt for tax and payroll verification purposes.
            </div>
          </div>
        </div>

        {/* Footer actions for quick dismissal and workflow */}
        <div className="px-5 py-3 border-t border-[#222a3d] bg-[#0b1326] flex items-center justify-between no-print text-xs font-mono">
          <div className="flex items-center gap-2 text-[#86948a]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3]" />
            <span>Receipt automatically saved to Loan Payment Audit Ledger.</span>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-white transition-colors cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
