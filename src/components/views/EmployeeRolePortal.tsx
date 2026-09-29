import React from 'react'
import { BarChart3, BriefcaseBusiness, Calculator, CalendarDays, ClipboardList, FileText, LayoutDashboard, Users, WalletCards } from 'lucide-react'

type PortalRole = 'finance' | 'hr' | 'sales' | 'services' | 'manager'

const portalConfig: Record<PortalRole, {
  title: string
  subtitle: string
  modules: string[]
}> = {
  finance: {
    title: 'Finance Employee Portal',
    subtitle: 'Accounts handling, finance tasks, approvals, and assigned financial records.',
    modules: ['Finance dashboard', 'Expenses & receipts', 'Invoices & accounts receivable', 'Payments & reconciliations', 'Assigned finance tasks', 'Notifications'],
  },
  hr: {
    title: 'HR Employee Portal',
    subtitle: 'Employee administration, attendance, onboarding, leave, and assigned HR work.',
    modules: ['HR dashboard', 'Employee records', 'Attendance & leave', 'Onboarding', 'HR tasks', 'Notifications'],
  },
  sales: {
    title: 'Sales Employee Portal',
    subtitle: 'Leads, prospects, follow-ups, quotations, and assigned sales work.',
    modules: ['Sales dashboard', 'My leads', 'Follow-ups', 'Quotations', 'Client pipeline', 'Notifications'],
  },
  services: {
    title: 'Services Employee Portal',
    subtitle: 'Assigned projects, estimating, BIM, shop drawings, RFIs, and deliverables.',
    modules: ['Services dashboard', 'My projects', 'Assigned tasks', 'Estimation workspace', 'RFIs & responses', 'Documents & deliverables'],
  },
  manager: {
    title: 'Manager Employee Portal',
    subtitle: 'Team assignments, project oversight, approvals, and management tasks.',
    modules: ['Manager dashboard', 'Team workload', 'Project assignments', 'Approvals', 'Performance', 'Notifications'],
  },
}

const icons = [LayoutDashboard, ClipboardList, FileText, Calculator, Users, CalendarDays]

export function EmployeeRolePortal({ portalRole }: { portalRole: PortalRole }) {
  const config = portalConfig[portalRole] || portalConfig.services
  return (
    <div className="min-h-screen bg-[#080d18] text-[#dae2fd]">
      <div className="mx-auto max-w-7xl p-5 md:p-8">
        <header className="border-b border-[#222a3d] pb-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#4edea3]">Employee workspace</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">{config.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#86948a]">{config.subtitle}</p>
        </header>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {config.modules.map((module, index) => {
            const Icon = icons[index % icons.length]
            return (
              <section key={module} className="rounded-2xl border border-[#222a3d] bg-[#0d1728] p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4edea3]/10 text-[#4edea3]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-sm font-semibold text-white">{module}</h2>
                <p className="mt-1 text-xs leading-5 text-[#86948a]">Only records and tasks assigned to this employee will be loaded here.</p>
              </section>
            )
          })}
        </div>
        <div className="mt-6 rounded-2xl border border-[#4edea3]/20 bg-[#0d1728] p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#4edea3]">Access isolation</p>
          <p className="mt-2 text-xs leading-5 text-[#bbcabf]">
            This employee portal is selected from the employee's portal role. Corporate administration, ownership, treasury, People & Access, and unrelated department portals are not rendered.
          </p>
        </div>
      </div>
    </div>
  )
}

export type { PortalRole }
