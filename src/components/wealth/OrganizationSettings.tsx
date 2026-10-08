import React, { useEffect, useState } from 'react';

interface Department {
  id: string;
  workspaceId: string;
  name: string;
  code: string | null;
  description: string | null;
  managerUserId: string | null;
  status: string;
}

interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string | null;
}

interface Role {
  id: string;
  workspaceId: string | null;
  name: string;
  code: string;
  description: string | null;
  scope: string;
  isSystemRole: boolean;
  status: string;
  permissions: Permission[];
}

interface OrganizationSettingsProps {
  workspaceId: string;
  companyName: string;
}

type DepartmentForm = {
  name: string;
  code: string;
  description: string;
  managerUserId: string;
  status: 'active' | 'inactive';
};

const emptyForm: DepartmentForm = {
  name: '',
  code: '',
  description: '',
  managerUserId: '',
  status: 'active',
};

export const OrganizationSettings: React.FC<OrganizationSettingsProps> = ({
  workspaceId,
  companyName,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<Department | null>(null);

  const [form, setForm] = useState<DepartmentForm>(emptyForm);

  const [activeSection, setActiveSection] = useState<'departments' | 'roles'>('departments');
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/workspace/departments?workspaceId=${encodeURIComponent(
          workspaceId,
        )}`,
        {
          credentials: 'include',
        },
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to load departments');
      }

      setDepartments(payload.departments || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, [workspaceId]);

  const updateForm = (
    field: keyof DepartmentForm,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openAddDepartment = () => {
    setEditingDepartment(null);
    setForm(emptyForm);
    setError(null);
    setShowDepartmentForm(true);
  };

  const openEditDepartment = (department: Department) => {
    setEditingDepartment(department);

    setForm({
      name: department.name || '',
      code: department.code || '',
      description: department.description || '',
      managerUserId: department.managerUserId || '',
      status:
        department.status === 'inactive'
          ? 'inactive'
          : 'active',
    });

    setError(null);
    setShowDepartmentForm(true);
  };

  const closeDepartmentForm = () => {
    if (saving) return;

    setShowDepartmentForm(false);
    setEditingDepartment(null);
    setForm(emptyForm);
  };

  const saveDepartment = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('Department name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const isEditing = Boolean(editingDepartment);

      const url = isEditing
        ? `/api/workspace/departments/${editingDepartment?.id}`
        : '/api/workspace/departments';

      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          name: form.name.trim(),
          code: form.code.trim(),
          description: form.description.trim(),
          managerUserId: form.managerUserId.trim(),
          status: form.status,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.error ||
            (isEditing
              ? 'Unable to update department'
              : 'Unable to create department'),
        );
      }

      closeDepartmentForm();
      await loadDepartments();
    } catch (err: any) {
      setError(
        err?.message ||
          (editingDepartment
            ? 'Unable to update department'
            : 'Unable to create department'),
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleDepartmentStatus = async (
    department: Department,
  ) => {
    const newStatus =
      department.status === 'active'
        ? 'inactive'
        : 'active';

    const action =
      newStatus === 'active'
        ? 'activate'
        : 'deactivate';

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${department.name}"?`,
    );

    if (!confirmed) return;

    try {
      setError(null);

      const response = await fetch(
        `/api/workspace/departments/${department.id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceId,
            status: newStatus,
          }),
        },
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.error ||
            `Unable to ${action} department`,
        );
      }

      await loadDepartments();
    } catch (err: any) {
      setError(
        err?.message ||
          `Unable to ${action} department`,
      );
    }
  };

  const removeDepartment = async (
    department: Department,
  ) => {
    const confirmed = window.confirm(
      `Remove "${department.name}"?\n\nThe department will be deactivated rather than permanently deleted so organizational history is preserved.`,
    );

    if (!confirmed) return;

    try {
      setError(null);

      const response = await fetch(
        `/api/workspace/departments/${department.id}?workspaceId=${encodeURIComponent(
          workspaceId,
        )}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.error ||
            'Unable to remove department',
        );
      }

      await loadDepartments();
    } catch (err: any) {
      setError(
        err?.message ||
          'Unable to remove department',
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-[#4edea3]">
          Settings & Organization
        </div>

        <h1 className="mt-1 text-2xl font-bold text-[#dae2fd]">
          {companyName} Organization
        </h1>

        <p className="mt-2 text-sm text-[#86948a]">
          Configure this company's departments, people,
          roles, services, and teams.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[#222a3d] pb-3">
        <button
          type="button"
          className="rounded-md border border-[#4edea3] bg-[#4edea3]/10 px-4 py-2 text-xs font-mono font-bold text-[#4edea3]"
        >
          Departments
        </button>

        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-md border border-[#222a3d] bg-[#131b2e] px-4 py-2 text-xs font-mono text-[#586579]"
        >
          Roles & Permissions
        </button>

        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-md border border-[#222a3d] bg-[#131b2e] px-4 py-2 text-xs font-mono text-[#586579]"
        >
          Services
        </button>

        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-md border border-[#222a3d] bg-[#131b2e] px-4 py-2 text-xs font-mono text-[#586579]"
        >
          Teams
        </button>
      </div>

      {activeSection === 'departments' && (
      <section className="rounded-xl border border-[#222a3d] bg-[#0f172a]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#222a3d] p-5">
          <div>
            <h2 className="text-lg font-bold text-[#dae2fd]">
              Departments
            </h2>

            <p className="mt-1 text-xs text-[#86948a]">
              Add, edit, activate, deactivate, or remove
              departments for this company.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddDepartment}
            className="rounded-md bg-[#4edea3] px-4 py-2 text-xs font-mono font-bold text-[#003824] transition hover:opacity-90"
          >
            + Add Department
          </button>
        </div>

        {error && (
          <div className="m-5 rounded-md border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && (
          <div className="p-5 text-sm text-[#86948a]">
            Loading departments...
          </div>
        )}

        {!loading &&
          departments.length === 0 &&
          !error && (
            <div className="p-8 text-center">
              <div className="text-sm font-semibold text-[#dae2fd]">
                No departments configured
              </div>

              <p className="mt-2 text-xs text-[#86948a]">
                Click â€œAdd Departmentâ€ to create the first
                department.
              </p>
            </div>
          )}

        {!loading && departments.length > 0 && (
          <div className="divide-y divide-[#222a3d]">
            {[...departments].sort((a, b) => Number(b.status === 'active') - Number(a.status === 'active')).map((department, index) => (
              <React.Fragment key={department.id}>
                {department.status !== 'active' && (
                  index === 0 ||
                  [...departments].sort(
                    (a, b) =>
                      Number(b.status === 'active') -
                      Number(a.status === 'active')
                  )[index - 1]?.status === 'active'
                ) && (
                  <div className="border-t border-[#334155] px-5 py-3">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748b]">
                      Removed / Archived
                    </div>
                  </div>
                )}

                <div
                  className={`flex flex-wrap items-center justify-between gap-4 p-5 ${
                    department.status !== 'active'
                      ? 'bg-[#0b1020]/50 opacity-60'
                      : ''
                  }`}
                >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[#dae2fd]">
                      {department.name}
                    </h3>

                    {department.code && (
                      <span className="rounded border border-[#334155] px-2 py-0.5 text-[10px] font-mono text-[#86948a]">
                        {department.code}
                      </span>
                    )}

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-mono font-bold uppercase ${
                        department.status ===
                        'active'
                          ? 'bg-[#4edea3]/10 text-[#4edea3]'
                          : 'bg-[#64748b]/10 text-[#94a3b8]'
                      }`}
                    >
                      {department.status}
                    </span>
                  </div>

                  {department.description && (
                    <p className="mt-1 text-xs text-[#86948a]">
                      {department.description}
                    </p>
                  )}

                  {department.managerUserId && (
                    <p className="mt-1 text-[11px] text-[#64748b]">
                      Manager: {department.managerUserId}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openEditDepartment(
                        department,
                      )
                    }
                    className="rounded-md border border-[#334155] px-3 py-2 text-[11px] font-mono text-[#cbd5e1] hover:bg-[#131b2e]"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      department.status === 'active'
                        ? removeDepartment(department)
                        : toggleDepartmentStatus(department)
                    }
                    className={`rounded-md border px-3 py-2 text-[11px] font-mono ${
                      department.status === 'active'
                        ? 'border-red-500/40 text-red-300 hover:bg-red-500/10'
                        : 'border-[#4edea3]/40 text-[#4edea3] hover:bg-[#4edea3]/10'
                    }`}
                  >
                    {department.status === 'active' ? 'Remove' : 'Restore'}
                  </button>
                </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </section>
      )}

      {showDepartmentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#334155] bg-[#0f172a] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222a3d] p-5">
              <div>
                <h2 className="text-lg font-bold text-[#dae2fd]">
                  {editingDepartment
                    ? 'Edit Department'
                    : 'Add Department'}
                </h2>

                <p className="mt-1 text-xs text-[#86948a]">
                  {editingDepartment
                    ? `Update ${editingDepartment.name}.`
                    : `Create a department for ${companyName}.`}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDepartmentForm}
                disabled={saving}
                className="text-xl text-[#86948a] hover:text-[#dae2fd]"
              >
                Ã—
              </button>
            </div>

            <form
              onSubmit={saveDepartment}
              className="space-y-4 p-5"
            >
              <div>
                <label className="mb-1 block text-xs font-mono text-[#86948a]">
                  Department Name *
                </label>

                <input
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      'name',
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Operations"
                  autoFocus
                  className="w-full rounded-md border border-[#334155] bg-[#131b2e] px-3 py-2 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-mono text-[#86948a]">
                  Department Code
                </label>

                <input
                  value={form.code}
                  onChange={(event) =>
                    updateForm(
                      'code',
                      event.target.value,
                    )
                  }
                  placeholder="e.g. OPS"
                  className="w-full rounded-md border border-[#334155] bg-[#131b2e] px-3 py-2 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-mono text-[#86948a]">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm(
                      'description',
                      event.target.value,
                    )
                  }
                  placeholder="What does this department handle?"
                  rows={3}
                  className="w-full resize-none rounded-md border border-[#334155] bg-[#131b2e] px-3 py-2 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-mono text-[#86948a]">
                  Manager User ID
                </label>

                <input
                  value={form.managerUserId}
                  onChange={(event) =>
                    updateForm(
                      'managerUserId',
                      event.target.value,
                    )
                  }
                  placeholder="Optional"
                  className="w-full rounded-md border border-[#334155] bg-[#131b2e] px-3 py-2 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]"
                />

                <p className="mt-1 text-[10px] text-[#64748b]">
                  This will become a selectable employee
                  list when People & Employees is connected.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-mono text-[#86948a]">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    updateForm(
                      'status',
                      event.target.value,
                    )
                  }
                  className="w-full rounded-md border border-[#334155] bg-[#131b2e] px-3 py-2 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]"
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#222a3d] pt-4">
                <button
                  type="button"
                  onClick={closeDepartmentForm}
                  disabled={saving}
                  className="rounded-md border border-[#334155] px-4 py-2 text-xs font-mono text-[#cbd5e1] hover:bg-[#131b2e]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving || !form.name.trim()
                  }
                  className="rounded-md bg-[#4edea3] px-4 py-2 text-xs font-mono font-bold text-[#003824] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingDepartment
                      ? 'Save Changes'
                      : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

