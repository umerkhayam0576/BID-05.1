import React, { useMemo, useState } from 'react';
import { FileUp, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { FinanceAccount, FinanceTransaction } from '../../types/finance';

interface ImportTransactionsModalProps {
  isOpen: boolean;
  accounts: FinanceAccount[];
  onClose: () => void;
  onImport: (transactions: FinanceTransaction[]) => void;
}

const clean = (value: string) => value.trim().replace(/^"|"$/g, '');
const parseAmount = (value: string) => {
  const normalized = clean(value).replace(/[$,]/g, '');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
};

const parseCsv = (text: string, account: FinanceAccount | undefined): FinanceTransaction[] => {
  const rows = text.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
  if (rows.length < 2) return [];
  const headers = rows[0].split(',').map((header) => header.trim().toLowerCase());
  const find = (values: string[], names: string[]) => {
    const index = headers.findIndex((header) => names.some((name) => header.includes(name)));
    return index >= 0 ? clean(values[index] ?? '') : '';
  };
  return rows.slice(1).map((row, index): FinanceTransaction => {
    const values = row.split(',');
    const date = find(values, ['date']) || new Date().toISOString().slice(0, 10);
    const merchant = find(values, ['description', 'merchant', 'payee', 'name']) || 'Imported transaction';
    const rawAmount = parseAmount(find(values, ['amount', 'value', 'total']));
    const debit = parseAmount(find(values, ['debit', 'withdrawal']));
    const credit = parseAmount(find(values, ['credit', 'deposit']));
    const amount = debit > 0 ? -debit : credit > 0 ? credit : rawAmount;
    return { id: `TX-IMP-${Date.now()}-${index}`, date, merchant, category: 'Uncategorized', accountName: account?.name ?? 'Imported account', amount, type: amount >= 0 ? 'income' : 'expense', status: 'cleared' };
  }).filter((transaction) => transaction.amount !== 0);
};

const parseOfx = (text: string, account: FinanceAccount | undefined): FinanceTransaction[] => {
  const blocks = text.split(/<STMTTRN>/i).slice(1);
  return blocks.map((block, index): FinanceTransaction => {
    const value = (tag: string) => clean(block.match(new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i'))?.[1] ?? '');
    const rawAmount = parseAmount(value('TRNAMT'));
    const dateValue = value('DTPOSTED').slice(0, 8);
    const date = dateValue.length === 8 ? `${dateValue.slice(0, 4)}-${dateValue.slice(4, 6)}-${dateValue.slice(6, 8)}` : new Date().toISOString().slice(0, 10);
    return { id: `TX-IMP-${Date.now()}-${index}`, date, merchant: value('NAME') || value('MEMO') || 'Imported transaction', category: 'Uncategorized', accountName: account?.name ?? 'Imported account', amount: rawAmount, type: rawAmount >= 0 ? 'income' : 'expense', status: 'cleared' };
  }).filter((transaction) => transaction.amount !== 0);
};

export const ImportTransactionsModal: React.FC<ImportTransactionsModalProps> = ({ isOpen, accounts, onClose, onImport }) => {
  const [fileName, setFileName] = useState('');
  const [text, setText] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const selectedAccount = accounts.find((account) => account.id === accountId);
  const transactions = useMemo(() => fileName.toLowerCase().endsWith('.ofx') ? parseOfx(text, selectedAccount) : parseCsv(text, selectedAccount), [fileName, selectedAccount, text]);

  if (!isOpen) return null;
  const readFile = async (file: File) => { setFileName(file.name); setText(await file.text()); };
  const submit = () => { if (transactions.length) { onImport(transactions); onClose(); setFileName(''); setText(''); } };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="import-transactions-title">
    <div className="w-full max-w-xl rounded-xl border border-[#2d3449] bg-[#131b2e] p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-wider text-[#4edea3] font-mono font-bold">Import activity</p><h2 id="import-transactions-title" className="mt-1 text-lg font-bold text-[#dae2fd]">Import CSV or OFX transactions</h2><p className="mt-1 text-xs text-[#86948a]">Transactions are added as cleared and uncategorized for review.</p></div><button onClick={onClose} aria-label="Close import dialog" className="text-[#86948a] hover:text-[#dae2fd]"><X className="h-5 w-5" /></button></div>
      <label className="mt-5 block text-xs font-semibold text-[#bbcabf]">Account<select value={accountId} onChange={(event) => setAccountId(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 text-xs text-[#dae2fd]">{accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.accountNumberMask}</option>)}</select></label>
      <label className="mt-4 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#3b455b] bg-[#0b1326] text-center hover:border-[#4edea3]"><FileUp className="h-6 w-6 text-[#4edea3]" /><span className="mt-2 text-sm font-semibold text-[#dae2fd]">{fileName || 'Choose a CSV or OFX file'}</span><span className="mt-1 text-[11px] text-[#86948a]">Supported: .csv, .ofx</span><input type="file" accept=".csv,.ofx,text/csv,application/x-ofx" className="sr-only" onChange={(event) => event.target.files?.[0] && readFile(event.target.files[0])} /></label>
      <div className="mt-4 rounded-lg border border-[#222a3d] bg-[#0b1326] p-3 text-xs">{fileName ? <div className="flex items-center gap-2 text-[#bbcabf]"><CheckCircle2 className="h-4 w-4 text-[#4edea3]" />{transactions.length} transaction{transactions.length === 1 ? '' : 's'} ready to import</div> : <div className="flex items-start gap-2 text-[#86948a]"><AlertCircle className="h-4 w-4 shrink-0" />CSV headers can include Date, Description, Amount, Debit, Credit, and Category.</div>}</div>
      <div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="h-9 rounded-md border border-[#2d3449] px-4 text-xs font-semibold text-[#dae2fd]">Cancel</button><button disabled={!transactions.length} onClick={submit} className="h-9 rounded-md bg-[#4edea3] px-4 text-xs font-bold text-[#003824] disabled:cursor-not-allowed disabled:opacity-40">Import transactions</button></div>
    </div>
  </div>;
};

export default ImportTransactionsModal;
