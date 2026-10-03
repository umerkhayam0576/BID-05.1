import React, { useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  LayoutDashboard,
  Plus,
  Receipt,
  RefreshCw,
  LogOut,
  Send,
  Settings,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';

type PortalRole =
  | 'finance'
  | 'hr'
  | 'sales'
  | 'services'
  | 'manager';

interface EmployeeRolePortalProps {
  portalRole: PortalRole;
  workspaceId: string;
  onLogout?: () => void;
}

interface FinanceDashboard {
  workspaceId?: string;

  metrics?: {
    totalCash?: number;
    accountsCount?: number;
    accountsReceivable?: number;
    totalExpenses?: number;
    totalPayments?: number;
    outstandingInvoices?: number;
  };

  totalCash?: number;
  accountsCount?: number;
  accountsReceivable?: number;
  totalExpenses?: number;
  totalPayments?: number;
  outstandingInvoices?: number;
}

interface FinanceExpense {
  id: string;
  workspaceId?: string;
  employeeUserId?: string;
  projectId?: string | null;
  category: string;
  description: string;
  amount: string | number;
  currency: string;
  expenseDate: string;
  receiptFilePath?: string | null;
  status: string;
  notes?: string | null;
}

interface ExpenseFormData {
  category: string;
  description: string;
  amount: string;
  currency: string;
  expenseDate: string;
  projectId: string;
  receiptFilePath: string;
  notes: string;
}

const portalConfig: Record<
  PortalRole,
  {
    title: string;
    subtitle: string;
    icon: React.ElementType;
  }
> = {
  finance: {
    title: 'Finance Employee Portal',
    subtitle: 'Manage assigned finance work and expense records.',
    icon: DollarSign,
  },

  hr: {
    title: 'HR Employee Portal',
    subtitle: 'Manage assigned human resources work.',
    icon: BriefcaseBusiness,
  },

  sales: {
    title: 'Sales Employee Portal',
    subtitle: 'Manage assigned sales activities.',
    icon: BarChart3,
  },

  services: {
    title: 'Services Employee Portal',
    subtitle: 'Manage assigned service and project work.',
    icon: FileText,
  },

  manager: {
    title: 'Manager Portal',
    subtitle: 'Manage assigned projects and team activities.',
    icon: LayoutDashboard,
  },
};

const financeNavigation = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },

  {
    id: 'expenses',
    label: 'Expenses & Receipts',
    icon: Receipt,
  },

  {
    id: 'invoices',
    label: 'Invoices',
    icon: FileText,
  },

  {
    id: 'payments',
    label: 'Payments',
    icon: DollarSign,
  },

  {
    id: 'reconciliation',
    label: 'Reconciliation',
    icon: CheckCircle2,
  },

  {
    id: 'tasks',
    label: 'My Tasks',
    icon: Clock3,
  },
];

function formatCurrency(
  value: number | string | null | undefined,
  currency = 'USD'
) {
  const numericValue = Number(value ?? 0);

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch {
    return currency + ' ' + numericValue.toFixed(2);
  }
}

function FinancePortal({
  workspaceId,
  onLogout,
}: {
  workspaceId: string;
  onLogout?: () => void;
}) {
  const [activeSection, setActiveSection] =
    useState('dashboard');

  const [dashboard, setDashboard] =
    useState<FinanceDashboard | null>(null);

  const [expenses, setExpenses] =
    useState<FinanceExpense[]>([]);

  const [loadingDashboard, setLoadingDashboard] =
    useState(true);

  const [loadingExpenses, setLoadingExpenses] =
    useState(true);

  const [expensesError, setExpensesError] =
    useState('');

  const loadDashboard = async () => {
    if (!workspaceId) return;

    try {
      setLoadingDashboard(true);

      const response = await fetch(
        '/api/finance/company/dashboard?workspaceId=' +
          encodeURIComponent(workspaceId),
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
  throw new Error(
    'Dashboard request failed: ' + response.status
  );
}

      const data = await response.json();

      setDashboard(data);
    } catch (error) {
      console.error(
        'Failed to load finance dashboard:',
        error
      );
    } finally {
      setLoadingDashboard(false);
    }
  };

  const loadExpenses = async () => {
    if (!workspaceId) return;

    try {
      setLoadingExpenses(true);
      setExpensesError('');

      const response = await fetch(
        '/api/finance/company/expenses?workspaceId=' +
          encodeURIComponent(workspaceId),
        {
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        }
      );
if (!response.ok) {
  throw new Error(
    'Expenses request failed: ' + response.status
  );
}
      const data = await response.json();

      const expenseList = Array.isArray(data)
        ? data
        : Array.isArray(data?.expenses)
          ? data.expenses
          : [];

      setExpenses(expenseList);
    } catch (error) {
      console.error(
        'Failed to load expenses:',
        error
      );

      setExpensesError(
        error instanceof Error
          ? error.message
          : 'Failed to load expenses.'
      );
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    if (!workspaceId) return;

    void loadDashboard();
    void loadExpenses();
  }, [workspaceId]);

  const handleExpenseSubmitted = async () => {
    await loadExpenses();
    await loadDashboard();
  };

  const dashboardMetrics = dashboard?.metrics;

  const totalCash =
    dashboardMetrics?.totalCash ??
    dashboard?.totalCash ??
    0;

  const accountsCount =
    dashboardMetrics?.accountsCount ??
    dashboard?.accountsCount ??
    0;

  const accountsReceivable =
    dashboardMetrics?.accountsReceivable ??
    dashboard?.accountsReceivable ??
    0;

  const totalExpenses =
    dashboardMetrics?.totalExpenses ??
    dashboard?.totalExpenses ??
    0;

  const totalPayments =
    dashboardMetrics?.totalPayments ??
    dashboard?.totalPayments ??
    0;

  const outstandingInvoices =
    dashboardMetrics?.outstandingInvoices ??
    dashboard?.outstandingInvoices ??
    0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                <DollarSign size={20} />
              </div>

              <div>
                <h1 className="text-sm font-semibold text-slate-900">
                  Finance Portal
                </h1>

                <p className="text-xs text-slate-500">
                  Employee workspace
                </p>
              </div>
            </div>
          </div>

          <nav className="space-y-1 p-3">
            {financeNavigation.map((item) => {
              const Icon = item.icon;
              const active =
                activeSection === item.id;

              return (
  <button
    key={item.id}
    type="button"
    onClick={() => setActiveSection(item.id)}
    className={
      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ' +
      (active
        ? 'bg-slate-900 text-white'
        : 'text-slate-600 hover:bg-slate-100')
    }
  >
    <Icon size={17} />
    <span>{item.label}</span>
  </button>
);
            })}
          </nav>

          <div className="absolute bottom-0 w-64 border-t border-slate-200 bg-white p-3">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              <Settings size={17} />
              <span>Settings</span>
            </button>
          </div>
        </aside>

        <main className="flex-1">
          <header className="border-b border-slate-200 bg-white px-8 py-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Finance Employee Portal
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage your assigned finance work and
                expense records.
              </p>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <LogOut size={16} />
                Logout
              </button>
            )}
        </header>

          <div className="p-8">
            {activeSection === 'dashboard' && (
              <FinanceDashboardView
                dashboard={{
                  totalCash,
                  accountsCount,
                  accountsReceivable,
                  totalExpenses,
                  totalPayments,
                  outstandingInvoices,
                }}
                loading={loadingDashboard}
              />
            )}

            {activeSection === 'expenses' && (
              <ExpensesModule
                workspaceId={workspaceId}
                expenses={expenses}
                loading={loadingExpenses}
                error={expensesError}
                onRefresh={loadExpenses}
                onSubmitted={
                  handleExpenseSubmitted
                }
              />
            )}

            {activeSection === 'invoices' && (
              <EmptyModule
                title="Invoices"
                description="Invoice management will be available here."
                icon={FileText}
              />
            )}

            {activeSection === 'payments' && (
              <EmptyModule
                title="Payments"
                description="Payment records will be available here."
                icon={DollarSign}
              />
            )}

            {activeSection === 'reconciliation' && (
              <EmptyModule
                title="Reconciliation"
                description="Account reconciliation will be available here."
                icon={CheckCircle2}
              />
            )}

            {activeSection === 'tasks' && (
              <EmptyModule
                title="My Tasks"
                description="Finance tasks assigned to you will appear here."
                icon={Clock3}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function FinanceDashboardView({
  dashboard,
  loading,
}: {
  dashboard: FinanceDashboard | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Finance Dashboard
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Loading your finance workspace...
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  const totalCash =
    dashboard?.totalCash ?? 0;

  const accountsReceivable =
    dashboard?.accountsReceivable ?? 0;

  const totalExpenses =
    dashboard?.totalExpenses ?? 0;

  const totalPayments =
    dashboard?.totalPayments ?? 0;

  const outstandingInvoices =
    dashboard?.outstandingInvoices ?? 0;

  const accountsCount =
    dashboard?.accountsCount ?? 0;

  const netCashMovement =
    totalPayments - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">
            Finance Dashboard
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Financial overview, cash position,
            expenses, receivables, and payment activity.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
          Finance Workspace
        </div>
      </div>

      {/* Primary financial metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Cash & Bank Balance"
          value={formatCurrency(totalCash)}
          icon={Wallet}
        />

        <MetricCard
          title="Accounts Receivable"
          value={formatCurrency(
            accountsReceivable
          )}
          icon={FileText}
        />

        <MetricCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          icon={Receipt}
        />

        <MetricCard
          title="Payments Received"
          value={formatCurrency(totalPayments)}
          icon={ArrowDownLeft}
        />
      </div>

      {/* Secondary financial metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Outstanding Invoices"
          value={formatCurrency(
            outstandingInvoices
          )}
          icon={Clock3}
        />

        <MetricCard
          title="Finance Accounts"
          value={String(accountsCount)}
          icon={BriefcaseBusiness}
        />

        <MetricCard
          title="Net Cash Movement"
          value={formatCurrency(
            netCashMovement
          )}
          icon={TrendingUp}
        />

        <MetricCard
          title="Financial Status"
          value={
            netCashMovement >= 0
              ? 'Positive'
              : 'Review'
          }
          icon={ShieldCheck}
        />
      </div>

      {/* Cash flow and receivables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardPanel title="Cash Flow Snapshot">
          <div className="space-y-1">
            <InfoRow
              label="Payments received"
              value={formatCurrency(
                totalPayments
              )}
            />

            <InfoRow
              label="Recorded expenses"
              value={formatCurrency(
                totalExpenses
              )}
            />

            <InfoRow
              label="Net movement"
              value={formatCurrency(
                netCashMovement
              )}
            />

            <InfoRow
              label="Current cash & bank"
              value={formatCurrency(
                totalCash
              )}
            />
          </div>
        </DashboardPanel>

        <DashboardPanel title="Receivables & Invoices">
          <div className="space-y-1">
            <InfoRow
              label="Accounts receivable"
              value={formatCurrency(
                accountsReceivable
              )}
            />

            <InfoRow
              label="Outstanding invoices"
              value={formatCurrency(
                outstandingInvoices
              )}
            />

            <InfoRow
              label="Finance accounts"
              value={String(accountsCount)}
            />

            <InfoRow
              label="Collection position"
              value={
                outstandingInvoices > 0
                  ? 'Receivables require attention'
                  : 'No outstanding balance'
              }
            />
          </div>
        </DashboardPanel>
      </div>

      {/* Expense overview */}
      <DashboardPanel title="Expense Overview">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Total expenses
            </p>

            <p className="mt-2 text-xl font-semibold text-slate-900">
              {formatCurrency(totalExpenses)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              All recorded finance expenses
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Payment activity
            </p>

            <p className="mt-2 text-xl font-semibold text-slate-900">
              {formatCurrency(totalPayments)}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Payments recorded in the workspace
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Outstanding
            </p>

            <p className="mt-2 text-xl font-semibold text-slate-900">
              {formatCurrency(
                outstandingInvoices
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Invoice balance requiring collection
            </p>
          </div>
        </div>
      </DashboardPanel>

      {/* Accountant action center */}
      <DashboardPanel title="Finance Action Center">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ActionCard
            title="Review expenses"
            description="Check submitted and pending expense records."
          />

          <ActionCard
            title="Review invoices"
            description="Monitor outstanding and unpaid invoices."
          />

          <ActionCard
            title="Check payments"
            description="Review incoming payment activity."
          />

          <ActionCard
            title="Reconcile accounts"
            description="Verify account balances against statements."
          />
        </div>
      </DashboardPanel>

      {/* Privacy and access notice */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="mt-0.5 text-slate-500"
            size={20}
          />

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Finance access
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              This dashboard is limited to finance
              information available to this workspace and
              finance role. Personal employee information,
              private client information, and unrelated
              company administration are not exposed here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpensesModule({
  workspaceId,
  expenses,
  loading,
  error,
  onRefresh,
  onSubmitted,
}: {
  workspaceId: string;
  expenses: FinanceExpense[];
  loading: boolean;
  error: string;
  onRefresh: () => Promise<void>;
  onSubmitted: () => Promise<void>;
}) {
  const [showForm, setShowForm] =
    useState(false);

  if (showForm) {
    return (
      <AddExpenseForm
        workspaceId={workspaceId}
        onCancel={() => setShowForm(false)}
        onSubmitted={async () => {
          setShowForm(false);
          await onSubmitted();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Expenses & Receipts
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Submit and review your finance expense records.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void onRefresh()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <div className="font-semibold">
            Could not load expenses
          </div>

          <div className="mt-1">
            {error}
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Loading expenses...
        </div>
      ) : expenses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Receipt className="mx-auto h-10 w-10 text-slate-400" />

          <h4 className="mt-4 text-sm font-semibold text-slate-900">
            No expenses yet
          </h4>

          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            No expense records are currently available
            in this finance workspace.
          </p>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus size={16} />
            Add your first expense
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div className="text-sm font-semibold text-slate-900">
              {expenses.length} expense
              {expenses.length === 1
                ? ''
                : 's'}{' '}
              found
            </div>

            <div className="mt-1 text-xs text-slate-500">
              Loaded from the finance workspace.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Category
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                      {expense.expenseDate}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {expense.category}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {expense.description}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-slate-900">
                      {formatCurrency(
                        expense.amount,
                        expense.currency
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <ExpenseStatus
                        status={expense.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AddExpenseForm({
  workspaceId,
  onCancel,
  onSubmitted,
}: {
  workspaceId: string;
  onCancel: () => void;
  onSubmitted: () => Promise<void>;
}) {
  const [form, setForm] =
    useState<ExpenseFormData>({
      category: '',
      description: '',
      amount: '',
      currency: 'USD',
      expenseDate: new Date()
        .toISOString()
        .slice(0, 10),
      projectId: '',
      receiptFilePath: '',
      notes: '',
    });

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const updateField = (
    field: keyof ExpenseFormData,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!workspaceId) {
      setError(
        'Workspace information is missing.'
      );
      return;
    }

    if (!form.category.trim()) {
      setError(
        'Please enter an expense category.'
      );
      return;
    }

    if (!form.description.trim()) {
      setError(
        'Please enter an expense description.'
      );
      return;
    }

    const amount = Number(form.amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        'Please enter a valid expense amount.'
      );
      return;
    }

    if (!form.expenseDate) {
      setError(
        'Please select an expense date.'
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        '/api/finance/company/expenses',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            workspaceId,
            category:
              form.category.trim(),
            description:
              form.description.trim(),
            amount,
            currency: form.currency,
            expenseDate:
              form.expenseDate,
            projectId:
              form.projectId.trim() ||
              null,
            receiptFilePath:
              form.receiptFilePath.trim() ||
              null,
            notes:
              form.notes.trim() ||
              null,
          }),
        }
      );

      const data =
        await response.json().catch(
          () => null
        );
if (!response.ok) {
  throw new Error(
    data?.error ||
      'Failed to submit expense (' + response.status + ')'
  );
}

      setSuccess(
        'Expense submitted successfully.'
      );

      await new Promise((resolve) =>
        setTimeout(resolve, 500)
      );

      await onSubmitted();
    } catch (submitError) {
      console.error(
        'Failed to submit expense:',
        submitError
      );

      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to submit expense.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Add Expense
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Submit a new expense to the finance workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6"
      >
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            label="Category"
            required
          >
            <input
              value={form.category}
              onChange={(event) =>
                updateField(
                  'category',
                  event.target.value
                )
              }
              placeholder="Software"
              className="form-input"
              disabled={submitting}
            />
          </FormField>

          <FormField
            label="Amount"
            required
          >
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(event) =>
                updateField(
                  'amount',
                  event.target.value
                )
              }
              placeholder="25.00"
              className="form-input"
              disabled={submitting}
            />
          </FormField>

          <FormField
            label="Currency"
            required
          >
            <select
              value={form.currency}
              onChange={(event) =>
                updateField(
                  'currency',
                  event.target.value
                )
              }
              className="form-input"
              disabled={submitting}
            >
              <option value="USD">
                USD
              </option>
              <option value="PKR">
                PKR
              </option>
              <option value="EUR">
                EUR
              </option>
              <option value="GBP">
                GBP
              </option>
              <option value="AED">
                AED
              </option>
              <option value="CAD">
                CAD
              </option>
              <option value="AUD">
                AUD
              </option>
            </select>
          </FormField>

          <FormField
            label="Expense date"
            required
          >
            <input
              type="date"
              value={form.expenseDate}
              onChange={(event) =>
                updateField(
                  'expenseDate',
                  event.target.value
                )
              }
              className="form-input"
              disabled={submitting}
            />
          </FormField>

          <FormField label="Project ID">
            <input
              value={form.projectId}
              onChange={(event) =>
                updateField(
                  'projectId',
                  event.target.value
                )
              }
              placeholder="Optional"
              className="form-input"
              disabled={submitting}
            />
          </FormField>

          <FormField label="Receipt reference">
            <input
              value={
                form.receiptFilePath
              }
              onChange={(event) =>
                updateField(
                  'receiptFilePath',
                  event.target.value
                )
              }
              placeholder="Optional"
              className="form-input"
              disabled={submitting}
            />
          </FormField>
        </div>

        <FormField
          label="Description"
          required
        >
          <input
            value={form.description}
            onChange={(event) =>
              updateField(
                'description',
                event.target.value
              )
            }
            placeholder="Finance portal test expense"
            className="form-input"
            disabled={submitting}
          />
        </FormField>

        <FormField label="Notes">
          <textarea
            value={form.notes}
            onChange={(event) =>
              updateField(
                'notes',
                event.target.value
              )
            }
            placeholder="Optional notes"
            rows={4}
            className="form-input resize-none"
            disabled={submitting}
          />
        </FormField>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} />

            {submitting
              ? 'Submitting...'
              : 'Submit Expense'}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

function ExpenseStatus({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toLowerCase();

  let className =
    'bg-slate-100 text-slate-700';

  if (normalized === 'approved') {
    className =
      'bg-green-100 text-green-700';
  } else if (
    normalized === 'submitted'
  ) {
    className =
      'bg-blue-100 text-blue-700';
  } else if (
    normalized === 'rejected'
  ) {
    className =
      'bg-red-100 text-red-700';
  } else if (normalized === 'paid') {
    className =
      'bg-emerald-100 text-emerald-700';
  }

  return (
    <span
      className={'inline-flex rounded-full px-2.5 py-1 text-xs font-medium ' + className}
    >
      {status}
    </span>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {value}
          </p>
        </div>

        <div className="rounded-lg bg-slate-100 p-2.5 text-slate-700">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function DashboardPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h4 className="text-sm font-semibold text-slate-900">
          {title}
        </h4>
      </div>

      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-medium text-slate-900">
        {value}
      </span>
    </div>
  );
}

function ActionCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-white p-2 text-slate-700 shadow-sm">
          <CheckCircle2 size={17} />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-900">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyModule({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <Icon className="mx-auto h-10 w-10 text-slate-400" />

      <h3 className="mt-4 text-lg font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

export function EmployeeRolePortal({
  portalRole,
  workspaceId,
  onLogout,
}: EmployeeRolePortalProps) {
  if (portalRole === 'finance') {
    return (
      <FinancePortal
        workspaceId={workspaceId}
        onLogout={onLogout}
      />
    );
  }
  const config =
    portalConfig[portalRole];

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Icon size={26} />
          </div>

          <h1 className="mt-5 text-2xl font-semibold text-slate-900">
            {config.title}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {config.subtitle}
          </p>

          <div className="mt-8 rounded-lg bg-slate-50 p-5 text-sm text-slate-600">
            This portal module is being built next.
          </div>
        </div>
      </div>
    </div>
  );
}

export type { PortalRole };




