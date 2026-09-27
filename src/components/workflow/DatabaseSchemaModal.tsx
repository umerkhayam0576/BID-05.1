import React, { useState } from 'react';
import {
  X,
  Database,
  Table,
  Key,
  Link2,
  Copy,
  Check,
  Code2,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { WORKFLOW_DATABASE_SCHEMA } from '../../data/workflowData';

interface DatabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedTable, setSelectedTable] = useState<string>('quotes');
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'visual_erd' | 'table_specs' | 'sql_ddl'>('visual_erd');

  if (!isOpen) return null;

  const currentTable = WORKFLOW_DATABASE_SCHEMA.find((t) => t.tableName === selectedTable) || WORKFLOW_DATABASE_SCHEMA[0];

  const generateFullSql = () => {
    return `-- =========================================================
-- BID EXACT LLC - ENTERPRISE WORKFLOW POSTGRESQL SCHEMA
-- Deliverable 1: Core Entity Models & Relationships
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('client_representative', 'estimator', 'senior_auditor', 'pm_lead', 'executive')),
    company_name VARCHAR(128) NOT NULL,
    qualifications JSONB DEFAULT '[]'::jsonb,
    current_weekly_hours NUMERIC(5,2) DEFAULT 0.00,
    max_weekly_capacity NUMERIC(5,2) DEFAULT 40.00,
    performance_rating NUMERIC(3,2) DEFAULT 5.00 CHECK (performance_rating >= 1.00 AND performance_rating <= 5.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_hours ON users(role, current_weekly_hours);

-- 2. QUOTES TABLE
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number VARCHAR(32) UNIQUE NOT NULL,
    intake_request_id UUID,
    client_id UUID REFERENCES users(id) ON DELETE SET NULL,
    client_company VARCHAR(128) NOT NULL,
    scope_summary TEXT NOT NULL,
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    markup_percent NUMERIC(4,2) NOT NULL DEFAULT 10.00,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    required_deposit_percent NUMERIC(4,2) NOT NULL DEFAULT 25.00,
    required_deposit_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    approval_token_hash VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'approved_pending_payment', 'paid_and_activated', 'rejected', 'expired')),
    signed_by_name VARCHAR(128),
    signed_ip_address VARCHAR(45),
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_quotes_number ON quotes(quote_number);
CREATE INDEX idx_quotes_status ON quotes(status);

-- 3. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    project_id UUID,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_type VARCHAR(32) NOT NULL CHECK (payment_type IN ('deposit_mobilization', 'milestone_progress', 'final_closeout')),
    gateway VARCHAR(32) NOT NULL CHECK (gateway IN ('stripe_elements', 'stripe_ach', 'manual_wire')),
    gateway_transaction_id VARCHAR(128) UNIQUE NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('pending', 'deposit_cleared', 'fully_paid', 'failed', 'refunded')),
    card_last4 VARCHAR(4),
    payer_email VARCHAR(255) NOT NULL,
    paid_at TIMESTAMPTZ
);
CREATE INDEX idx_payments_quote ON payments(quote_id);
CREATE UNIQUE INDEX idx_payments_gateway_txn ON payments(gateway_transaction_id);

-- 4. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_code VARCHAR(32) UNIQUE NOT NULL,
    quote_id UUID UNIQUE NOT NULL REFERENCES quotes(id),
    client_company VARCHAR(128) NOT NULL,
    title VARCHAR(255) NOT NULL,
    contract_value NUMERIC(12,2) NOT NULL,
    deposit_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'active', 'in_progress', 'qa_review', 'completed', 'delivered', 'on_hold')),
    priority VARCHAR(16) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('CRITICAL', 'HIGH', 'NORMAL')),
    estimated_hours NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    logged_hours NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    target_due_date DATE NOT NULL,
    qa_protocol_status JSONB NOT NULL DEFAULT '{"specComplianceVerified": false, "doubleTakeoffRecountPassed": false, "materialPricingVerified": false, "seniorAuditorSignoff": false, "auditPassed": false}'::jsonb,
    deliverables_vault JSONB DEFAULT '[]'::jsonb,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_projects_code ON projects(project_code);
CREATE INDEX idx_projects_status ON projects(status);

-- 5. ASSIGNMENTS TABLE (SMART RESOURCE ALLOCATION)
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    role_on_project VARCHAR(64) NOT NULL,
    allocated_weekly_hours NUMERIC(5,2) NOT NULL,
    assignment_method VARCHAR(32) NOT NULL CHECK (assignment_method IN ('smart_auto', 'manual_pm', 'reallocated', 'fallback_escalation')),
    matched_score_percent NUMERIC(5,2),
    match_criteria JSONB DEFAULT '{}'::jsonb,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_assignments_project ON assignments(project_id);
CREATE INDEX idx_assignments_user ON assignments(user_id);
`;
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(generateFullSql());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#4edea3]/10 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Relational Database Schema &amp; ERD Architecture
                </h2>
                <span className="px-2 py-0.5 rounded bg-[#4edea3]/10 border border-[#4edea3]/20 text-[10px] font-mono text-[#4edea3] font-semibold">
                  PostgreSQL 16 Compatible
                </span>
              </div>
              <p className="text-xs text-[#86948a]">
                Entity definitions for Users, Quotes, Projects, Payments, and Smart Assignments with foreign keys &amp; integrity constraints
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySql}
              className="h-8 px-3 rounded bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] text-xs font-mono text-[#dae2fd] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#4edea3]" />
                  <span className="text-[#4edea3]">Copied DDL</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#86948a]" />
                  <span>Copy SQL DDL</span>
                </>
              )}
            </button>
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
              onClick={() => setActiveTab('visual_erd')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'visual_erd'
                  ? 'bg-[#4edea3]/20 text-[#4edea3] font-bold border border-[#4edea3]/30'
                  : 'text-[#86948a] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Interactive ERD Visualizer</span>
            </button>
            <button
              onClick={() => setActiveTab('table_specs')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'table_specs'
                  ? 'bg-[#4edea3]/20 text-[#4edea3] font-bold border border-[#4edea3]/30'
                  : 'text-[#86948a] hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Entity Dictionary &amp; Indexes</span>
            </button>
            <button
              onClick={() => setActiveTab('sql_ddl')}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sql_ddl'
                  ? 'bg-[#4edea3]/20 text-[#4edea3] font-bold border border-[#4edea3]/30'
                  : 'text-[#86948a] hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Production SQL DDL Script</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-[#86948a] hidden sm:block">
            5 Core Entities &bull; 6 Foreign Keys &bull; 8 Performance Indexes
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0b1326]">
          {activeTab === 'visual_erd' && (
            <div className="space-y-6">
              {/* Entity Flow Diagram */}
              <div className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#86948a] font-semibold">
                    Entity Relationship Topology
                  </span>
                  <span className="text-xs font-mono text-[#4edea3]">
                    1:1 (Quote ➔ Project) &bull; 1:N (Project ➔ Assignments)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                  {/* Entity 1: Users */}
                  <div
                    onClick={() => setSelectedTable('users')}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedTable === 'users'
                        ? 'bg-[#172036] border-[#4edea3] shadow-[0_0_12px_rgba(78,222,163,0.15)]'
                        : 'bg-[#0b1326] border-[#222a3d] hover:border-[#3b4763]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Table className="w-3.5 h-3.5 text-[#adc6ff]" />
                        users
                      </span>
                      <span className="text-[9px] font-mono px-1 rounded bg-[#222a3d] text-[#86948a]">1:N</span>
                    </div>
                    <div className="text-[11px] text-[#86948a] space-y-1 font-mono">
                      <div className="text-[#4edea3] flex items-center gap-1">
                        <Key className="w-3 h-3 text-[#e0b44a]" /> id (PK)
                      </div>
                      <div>email (UNIQUE)</div>
                      <div>role (ENUM)</div>
                      <div>qualifications (JSONB)</div>
                      <div>weekly_hours (NUM)</div>
                    </div>
                  </div>

                  {/* Entity 2: Quotes */}
                  <div
                    onClick={() => setSelectedTable('quotes')}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedTable === 'quotes'
                        ? 'bg-[#172036] border-[#4edea3] shadow-[0_0_12px_rgba(78,222,163,0.15)]'
                        : 'bg-[#0b1326] border-[#222a3d] hover:border-[#3b4763]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Table className="w-3.5 h-3.5 text-[#4edea3]" />
                        quotes
                      </span>
                      <span className="text-[9px] font-mono px-1 rounded bg-[#222a3d] text-[#86948a]">1:1</span>
                    </div>
                    <div className="text-[11px] text-[#86948a] space-y-1 font-mono">
                      <div className="text-[#4edea3] flex items-center gap-1">
                        <Key className="w-3 h-3 text-[#e0b44a]" /> id (PK)
                      </div>
                      <div>quote_number</div>
                      <div className="text-[#adc6ff] flex items-center gap-1">
                        <Link2 className="w-3 h-3" /> client_id (FK)
                      </div>
                      <div>line_items (JSONB)</div>
                      <div>deposit_amount</div>
                      <div>status (ENUM)</div>
                    </div>
                  </div>

                  {/* Entity 3: Payments */}
                  <div
                    onClick={() => setSelectedTable('payments')}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedTable === 'payments'
                        ? 'bg-[#172036] border-[#4edea3] shadow-[0_0_12px_rgba(78,222,163,0.15)]'
                        : 'bg-[#0b1326] border-[#222a3d] hover:border-[#3b4763]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Table className="w-3.5 h-3.5 text-[#e0b44a]" />
                        payments
                      </span>
                      <span className="text-[9px] font-mono px-1 rounded bg-[#222a3d] text-[#86948a]">N:1</span>
                    </div>
                    <div className="text-[11px] text-[#86948a] space-y-1 font-mono">
                      <div className="text-[#4edea3] flex items-center gap-1">
                        <Key className="w-3 h-3 text-[#e0b44a]" /> id (PK)
                      </div>
                      <div className="text-[#adc6ff] flex items-center gap-1">
                        <Link2 className="w-3 h-3" /> quote_id (FK)
                      </div>
                      <div>amount (USD)</div>
                      <div>gateway_txn_id</div>
                      <div>status (cleared)</div>
                      <div>paid_at</div>
                    </div>
                  </div>

                  {/* Entity 4: Projects */}
                  <div
                    onClick={() => setSelectedTable('projects')}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedTable === 'projects'
                        ? 'bg-[#172036] border-[#4edea3] shadow-[0_0_12px_rgba(78,222,163,0.15)]'
                        : 'bg-[#0b1326] border-[#222a3d] hover:border-[#3b4763]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Table className="w-3.5 h-3.5 text-[#adc6ff]" />
                        projects
                      </span>
                      <span className="text-[9px] font-mono px-1 rounded bg-[#222a3d] text-[#86948a]">1:N</span>
                    </div>
                    <div className="text-[11px] text-[#86948a] space-y-1 font-mono">
                      <div className="text-[#4edea3] flex items-center gap-1">
                        <Key className="w-3 h-3 text-[#e0b44a]" /> id (PK)
                      </div>
                      <div className="text-[#adc6ff] flex items-center gap-1">
                        <Link2 className="w-3 h-3" /> quote_id (FK)
                      </div>
                      <div>project_code</div>
                      <div>status (active)</div>
                      <div>qa_protocol (JSONB)</div>
                      <div>target_due_date</div>
                    </div>
                  </div>

                  {/* Entity 5: Assignments */}
                  <div
                    onClick={() => setSelectedTable('assignments')}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedTable === 'assignments'
                        ? 'bg-[#172036] border-[#4edea3] shadow-[0_0_12px_rgba(78,222,163,0.15)]'
                        : 'bg-[#0b1326] border-[#222a3d] hover:border-[#3b4763]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Table className="w-3.5 h-3.5 text-[#ffb356]" />
                        assignments
                      </span>
                      <span className="text-[9px] font-mono px-1 rounded bg-[#222a3d] text-[#86948a]">N:M</span>
                    </div>
                    <div className="text-[11px] text-[#86948a] space-y-1 font-mono">
                      <div className="text-[#4edea3] flex items-center gap-1">
                        <Key className="w-3 h-3 text-[#e0b44a]" /> id (PK)
                      </div>
                      <div className="text-[#adc6ff] flex items-center gap-1">
                        <Link2 className="w-3 h-3" /> project_id (FK)
                      </div>
                      <div className="text-[#adc6ff] flex items-center gap-1">
                        <Link2 className="w-3 h-3" /> user_id (FK)
                      </div>
                      <div>allocated_hours</div>
                      <div>method (smart_auto)</div>
                      <div>match_score (96%)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Table Inspector */}
              <div className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="text-[#4edea3] font-mono">public.{currentTable.tableName}</span>
                      <span className="text-xs text-[#86948a] font-normal">&mdash; {currentTable.description}</span>
                    </h3>
                  </div>
                  <div className="font-mono text-xs text-[#86948a]">
                    PK: <span className="text-[#e0b44a]">{currentTable.primaryKey}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead className="bg-[#0b1326] text-[#86948a] uppercase text-[10px] tracking-wider border-b border-[#222a3d]">
                      <tr>
                        <th className="p-2.5">Column Name</th>
                        <th className="p-2.5">Data Type</th>
                        <th className="p-2.5">Nullable</th>
                        <th className="p-2.5">Description &amp; Constraints</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222a3d] text-[#dae2fd]">
                      {currentTable.columns.map((col) => (
                        <tr key={col.name} className="hover:bg-[#171f33]/50">
                          <td className="p-2.5 font-bold text-white flex items-center gap-1.5">
                            {col.name === 'id' && <Key className="w-3 h-3 text-[#e0b44a]" />}
                            {col.name.endsWith('_id') && <Link2 className="w-3 h-3 text-[#adc6ff]" />}
                            {col.name}
                          </td>
                          <td className="p-2.5 text-[#4edea3]">{col.type}</td>
                          <td className="p-2.5">
                            {col.nullable ? (
                              <span className="text-[#86948a]">NULL</span>
                            ) : (
                              <span className="text-[#ff7886] font-bold">NOT NULL</span>
                            )}
                          </td>
                          <td className="p-2.5 text-[#bbcabf] font-sans">{col.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Performance Indexes */}
                <div className="mt-4 pt-3 border-t border-[#222a3d] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#86948a]">Indexed Expressions:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentTable.indexes.map((idx, i) => (
                      <code key={i} className="px-2 py-0.5 rounded bg-[#0b1326] text-[#adc6ff] text-[11px] border border-[#222a3d]">
                        {idx.replace('CREATE ', '').replace(';', '')}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'table_specs' && (
            <div className="space-y-6">
              {WORKFLOW_DATABASE_SCHEMA.map((table) => (
                <div key={table.tableName} className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#222a3d] pb-2">
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-[#4edea3]" />
                      <span className="text-sm font-bold text-white font-mono">{table.tableName}</span>
                      <span className="text-xs text-[#86948a]">({table.columns.length} columns)</span>
                    </div>
                    <span className="text-xs text-[#86948a] font-sans">{table.description}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs font-mono">
                    {table.columns.map((c) => (
                      <div key={c.name} className="p-2 rounded bg-[#0b1326] border border-[#222a3d] flex items-center justify-between">
                        <span className="text-white font-medium">{c.name}</span>
                        <span className="text-[#4edea3]">{c.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'sql_ddl' && (
            <div className="relative">
              <pre className="p-4 rounded-xl bg-[#0b1326] border border-[#222a3d] text-xs font-mono text-[#dae2fd] overflow-x-auto max-h-[550px] leading-relaxed select-text">
                {generateFullSql()}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
          <div className="flex items-center gap-2 text-xs text-[#86948a]">
            <ShieldCheck className="w-4 h-4 text-[#4edea3]" />
            <span>Strict foreign key integrity enforced: CASCADE on quote deletion, RESTRICT on assigned user deletion</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#171f33] hover:bg-[#222a3d] text-xs text-white font-medium border border-[#2d3449] cursor-pointer"
          >
            Close Schema
          </button>
        </div>
      </div>
    </div>
  );
};
