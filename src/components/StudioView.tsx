import React, { useState } from 'react';
import { Building2, Users, ShieldCheck, Boxes, Workflow, FileText, Bot, Settings, Search, Plus, Activity } from 'lucide-react';

type StudioSection = 'overview' | 'companies' | 'users' | 'roles' | 'modules' | 'workflows' | 'documents' | 'ai' | 'security' | 'audit';

const sections: { id: StudioSection; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Studio Overview', icon: Activity },
  { id: 'companies', label: 'Companies / Tenants', icon: Building2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck },
  { id: 'modules', label: 'Modules & Templates', icon: Boxes },
  { id: 'workflows', label: 'Workflows & Automation', icon: Workflow },
  { id: 'documents', label: 'Documents & Policies', icon: FileText },
  { id: 'ai', label: 'AI Administration', icon: Bot },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'audit', label: 'Audit & Activity', icon: Activity },
];

const sectionCopy: Record<StudioSection, { title: string; description: string }> = {
  overview: { title: 'SaaS Studio', description: 'Central administration for the SaaS platform and every tenant company.' },
  companies: { title: 'Companies / Tenants', description: 'Create and administer isolated company workspaces, identity, documents and status.' },
  users: { title: 'Users', description: 'Manage platform users and their membership across authorized company workspaces.' },
  roles: { title: 'Roles & Permissions', description: 'Define roles, permissions and access policies enforced by the backend.' },
  modules: { title: 'Modules & Industry Templates', description: 'Configure which modules and industry capabilities are available to each company.' },
  workflows: { title: 'Workflows & Automation', description: 'Administer reusable workflows, triggers, approvals and automation rules.' },
  documents: { title: 'Documents & Policies', description: 'Control document requirements, file policies, retention and versioning.' },
  ai: { title: 'AI Administration', description: 'Control AI features, knowledge boundaries, permissions and usage policies.' },
  security: { title: 'Security', description: 'Manage tenant isolation, authentication policies, sessions and security controls.' },
  audit: { title: 'Audit & Activity', description: 'Review platform-level administrative events and tenant activity.' },
};

export const StudioView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<StudioSection>('overview');
  const active = sectionCopy[activeSection];

  return (
    <div className="min-h-full space-y-5">
      <div className="rounded-xl border border-[#2d3449] bg-[#0f172a] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#4edea3] font-bold mb-2">SaaS Control Center</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Studio</h1>
            <p className="text-sm text-[#86948a] mt-1 max-w-2xl">Administer the platform, companies, portals, modules, permissions and system policies from one internal control center.</p>
          </div>
          <button type="button" onClick={() => setActiveSection('companies')} className="h-10 px-4 rounded-md bg-[#4edea3] text-[#003824] text-xs font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Company
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          ['Companies', 'Tenant workspaces', 'companies', Building2],
          ['Users', 'Platform memberships', 'users', Users],
          ['Modules', 'Configurable capabilities', 'modules', Boxes],
          ['Security', 'Tenant isolation controls', 'security', ShieldCheck],
        ].map(([label, sub, id, Icon]) => (
          <button key={String(id)} type="button" onClick={() => setActiveSection(id as StudioSection)} className="text-left rounded-lg border border-[#2d3449] bg-[#131b2e] p-4 hover:border-[#4edea3]/40 transition-colors">
            <Icon className="w-5 h-5 text-[#4edea3] mb-3" />
            <div className="text-lg font-bold text-white">—</div>
            <div className="text-xs font-semibold text-[#dae2fd] mt-1">{label}</div>
            <div className="text-[10px] text-[#86948a] mt-1">{sub}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4">
        <nav className="rounded-lg border border-[#2d3449] bg-[#0f172a] p-2 space-y-1">
          {sections.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setActiveSection(id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs text-left transition-colors ${activeSection === id ? 'bg-[#171f33] text-white border-l-2 border-[#4edea3]' : 'text-[#bbcabf] hover:bg-[#131b2e]'}`}>
              <Icon className={`w-4 h-4 ${activeSection === id ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <section className="rounded-lg border border-[#2d3449] bg-[#0f172a] p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-[#222a3d] pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">{active.title}</h2>
              <p className="text-xs text-[#86948a] mt-1">{active.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 px-3 rounded-md border border-[#2d3449] bg-[#131b2e] flex items-center gap-2 text-xs text-[#86948a]">
                <Search className="w-3.5 h-3.5" /> Search
              </div>
              {activeSection !== 'overview' && <button type="button" className="h-9 px-3 rounded-md bg-[#171f33] border border-[#2d3449] text-xs text-[#dae2fd]">Configure</button>}
            </div>
          </div>

          {activeSection === 'overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {[
                ['Companies / Tenants', 'Create and manage isolated company workspaces.'],
                ['Users & Access', 'Control memberships, roles and permissions.'],
                ['Modules & Templates', 'Build reusable industry-specific configurations.'],
                ['Portals', 'Administer company, employee and client portal capabilities.'],
                ['AI Administration', 'Control AI features and authorized knowledge boundaries.'],
                ['Security & Audit', 'Monitor isolation, access and administrative activity.'],
              ].map(([title, text]) => (
                <button key={title} type="button" onClick={() => setActiveSection(sections.find((s) => s.label.startsWith(title.split(' ')[0]))?.id || 'companies')} className="text-left rounded-lg border border-[#222a3d] bg-[#131b2e] p-4 hover:border-[#4edea3]/30">
                  <div className="text-sm font-semibold text-[#dae2fd]">{title}</div>
                  <div className="text-xs text-[#86948a] mt-1">{text}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-[#2d3449] p-8 text-center">
              <div className="text-sm font-semibold text-[#dae2fd]">{active.title}</div>
              <p className="text-xs text-[#86948a] mt-2 max-w-xl mx-auto">Studio foundation is connected. This section is intentionally configuration-first; the database-backed administration controls will be added here without hardcoding Bid Exact as the SaaS platform.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
