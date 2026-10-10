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

  const [activeSection, setActiveSection] = useState<'departments' | 'roles' | 'portal-simulator'>('departments');
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [simulatorRoleId, setSimulatorRoleId] = useState<string>('');
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

  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      setError(null);
      const response = await fetch(`/api/workspace/roles?workspaceId=${encodeURIComponent(workspaceId)}`, { credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to load roles');
      setRoles(payload.roles || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load roles');
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'roles' || activeSection === 'portal-simulator') loadRoles();
  }, [activeSection, workspaceId]);

  const simulatorRole = roles.find((role) => role.id === simulatorRoleId) || null;

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
        {([
          ['departments', 'Departments'],
          ['roles', 'Roles & Permissions'],
          ['portal-simulator', 'Role Portal Simulator'],
        ] as const).map(([section, label]) => (
          <button key={section} type="button" onClick={() => setActiveSection(section)}
            className={`rounded-md border px-4 py-2 text-xs font-mono ${activeSection === section ? 'border-[#4edea3] bg-[#4edea3]/10 font-bold text-[#4edea3]' : 'border-[#222a3d] bg-[#131b2e] text-[#cbd5e1] hover:border-[#4edea3]/60'}`}>
            {label}
          </button>
        ))}
        <button type="button" disabled className="cursor-not-allowed rounded-md border border-[#222a3d] bg-[#131b2e] px-4 py-2 text-xs font-mono text-[#586579]">Services</button>
        <button type="button" disabled className="cursor-not-allowed rounded-md border border-[#222a3d] bg-[#131b2e] px-4 py-2 text-xs font-mono text-[#586579]">Teams</button>
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

      {activeSection === 'roles' && (
        <section className="rounded-xl border border-[#222a3d] bg-[#0f172a] p-5">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#dae2fd]">Roles &amp; Permissions</h2>
              <p className="mt-1 text-sm text-[#86948a]">
                Inspect role scope and assigned permissions for this workspace.
              </p>
            </div>
            <button type="button" onClick={loadRoles} className="rounded-md border border-[#334155] px-3 py-2 text-xs font-mono text-[#cbd5e1]">
              Refresh roles
            </button>
          </div>

          {error && (
            <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          {rolesLoading ? (
            <p className="text-sm text-[#86948a]">Loading roles...</p>
          ) : roles.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#334155] p-5 text-sm text-[#86948a]">
              No roles were returned. Check workspace access and role configuration.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {roles.map((role) => (
                <article key={role.id} className="rounded-lg border border-[#263247] bg-[#131b2e] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[#dae2fd]">{role.name}</h3>
                      <p className="mt-1 text-xs font-mono text-[#86948a]">{role.code}</p>
                    </div>
                    <span className="rounded border border-[#334155] px-2 py-1 text-[10px] uppercase text-[#cbd5e1]">
                      {role.isSystemRole ? 'System' : 'Custom'}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-[#a6b3c8]">
                    {role.description || 'No description provided.'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#86948a]">
                    <span className="rounded bg-[#0f172a] px-2 py-1">Scope: {role.scope}</span>
                    <span className="rounded bg-[#0f172a] px-2 py-1">
                      Permissions: {role.permissions?.length || 0}
                    </span>
                    <span className="rounded bg-[#0f172a] px-2 py-1">Status: {role.status}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className="mt-4 rounded-md border border-[#4edea3]/40 px-3 py-2 text-xs font-mono text-[#4edea3] hover:bg-[#4edea3]/10"
                  >
                    Inspect permissions
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeSection === 'portal-simulator' && (
        <section className="space-y-5 rounded-xl border border-[#222a3d] bg-[#0f172a] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#dae2fd]">Role Portal Simulator</h2>
              <p className="mt-1 text-sm text-[#86948a]">Preview portal areas inferred from this workspace role's assigned permissions.</p>
            </div>
            <button type="button" onClick={loadRoles} className="rounded-md border border-[#334155] px-3 py-2 text-xs font-mono text-[#cbd5e1]">Refresh roles</button>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
            Read-only preview. This does not sign in as the selected role or run real actions. Assigned permissions are configuration data; this does not prove every page or API endpoint enforces them.
          </div>
          {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
          <div>
            <label htmlFor="simulator-role-select" className="mb-2 block text-xs font-mono uppercase tracking-wider text-[#86948a]">Select a role to preview</label>
            <select id="simulator-role-select" value={simulatorRoleId} onChange={(event) => setSimulatorRoleId(event.target.value)} disabled={rolesLoading || roles.length === 0}
              className="w-full max-w-xl rounded-md border border-[#334155] bg-[#131b2e] px-3 py-3 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3] disabled:opacity-50">
              <option value="">Choose a role...</option>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name} ({role.code})</option>)}
            </select>
            {rolesLoading && <p className="mt-2 text-xs text-[#86948a]">Loading workspace roles...</p>}
            {!rolesLoading && roles.length === 0 && <p className="mt-2 text-xs text-[#86948a]">No roles are available for this workspace.</p>}
          </div>
          {simulatorRole && (
            <div className="space-y-5">
              <div className="rounded-lg border border-[#263247] bg-[#131b2e] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[#dae2fd]">{simulatorRole.name} portal preview</h3>
                    <p className="mt-1 text-xs font-mono text-[#86948a]">{simulatorRole.code} · {simulatorRole.scope} scope</p>
                  </div>
                  <span className="rounded border border-[#334155] px-2 py-1 text-[10px] uppercase text-[#cbd5e1]">{simulatorRole.isSystemRole ? 'System role' : 'Custom role'}</span>
                </div>
                <p className="mt-3 text-sm text-[#a6b3c8]">{simulatorRole.description || 'No description provided for this role.'}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md bg-[#0f172a] p-3"><p className="text-xs text-[#86948a]">Assigned permissions</p><p className="mt-1 text-xl font-bold text-[#dae2fd]">{simulatorRole.permissions?.length || 0}</p></div>
                  <div className="rounded-md bg-[#0f172a] p-3"><p className="text-xs text-[#86948a]">Permission modules</p><p className="mt-1 text-xl font-bold text-[#dae2fd]">{new Set((simulatorRole.permissions || []).map((permission) => permission.module || 'Other')).size}</p></div>
                  <div className="rounded-md bg-[#0f172a] p-3"><p className="text-xs text-[#86948a]">Role status</p><p className="mt-1 text-sm font-bold text-[#dae2fd]">{simulatorRole.status}</p></div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-[#dae2fd]">Simulated portal areas</h3>
                <p className="mt-1 text-xs text-[#86948a]">Areas below are derived from assigned permission modules. This is a planning preview, not a live user session.</p>
                {!simulatorRole.permissions?.length ? (
                  <p className="mt-3 rounded-lg border border-dashed border-[#334155] p-4 text-sm text-[#86948a]">No permissions are assigned, so no portal areas can be inferred from these records.</p>
                ) : (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {Array.from(new Set(simulatorRole.permissions.map((permission) => permission.module || 'Other'))).sort().map((moduleName) => {
                      const modulePermissions = simulatorRole.permissions.filter((permission) => (permission.module || 'Other') === moduleName);
                      return (
                        <article key={moduleName} className="rounded-lg border border-[#263247] bg-[#131b2e] p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-[#dae2fd]">{moduleName}</h4>
                            <span className="rounded bg-[#4edea3]/10 px-2 py-1 text-[10px] font-mono text-[#4edea3]">{modulePermissions.length} permission{modulePermissions.length === 1 ? '' : 's'}</span>
                          </div>
                          <ul className="mt-3 space-y-2">
                            {modulePermissions.map((permission) => <li key={permission.id} className="rounded-md bg-[#0f172a] p-2"><p className="text-xs font-medium text-[#dae2fd]">{permission.name}</p><p className="mt-1 break-all text-[10px] font-mono text-[#86948a]">{permission.code}</p></li>)}
                          </ul>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          {!simulatorRole && roles.length > 0 && <p className="rounded-lg border border-dashed border-[#334155] p-4 text-sm text-[#86948a]">Choose a role above to inspect its simulated portal areas and assigned permissions.</p>}
        </section>
      )}

      {selectedRole && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedRole(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Role permission inspector"
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#334155] bg-[#0f172a] p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#dae2fd]">{selectedRole.name}</h2>
                <p className="mt-1 text-xs font-mono text-[#86948a]">{selectedRole.code}</p>
              </div>
              <button type="button" onClick={() => setSelectedRole(null)} className="rounded-md border border-[#334155] px-3 py-2 text-xs text-[#cbd5e1]">
                Close
              </button>
            </div>

            <p className="mt-3 text-sm text-[#a6b3c8]">
              {selectedRole.description || 'No description provided.'}
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg bg-[#131b2e] p-3">
                <p className="text-xs text-[#86948a]">Scope</p>
                <p className="mt-1 text-sm text-[#dae2fd]">{selectedRole.scope}</p>
              </div>
              <div className="rounded-lg bg-[#131b2e] p-3">
                <p className="text-xs text-[#86948a]">Role type</p>
                <p className="mt-1 text-sm text-[#dae2fd]">
                  {selectedRole.isSystemRole ? 'System role' : 'Custom role'}
                </p>
              </div>
              <div className="rounded-lg bg-[#131b2e] p-3">
                <p className="text-xs text-[#86948a]">Permissions</p>
                <p className="mt-1 text-sm text-[#dae2fd]">
                  {selectedRole.permissions?.length || 0}
                </p>
              </div>
            </div>

            <h3 className="mt-5 font-semibold text-[#dae2fd]">Assigned permissions</h3>

            {!selectedRole.permissions?.length ? (
              <p className="mt-3 rounded-lg border border-dashed border-[#334155] p-4 text-sm text-[#86948a]">
                No permissions are linked to this role.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {selectedRole.permissions.map((permission) => (
                  <div key={permission.id} className="rounded-lg border border-[#263247] bg-[#131b2e] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[#dae2fd]">{permission.name}</p>
                      <span className="text-[10px] font-mono text-[#4edea3]">{permission.code}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#86948a]">Module: {permission.module}</p>
                    {permission.description && (
                      <p className="mt-1 text-xs text-[#a6b3c8]">{permission.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
              This inspector displays configured permissions. It does not impersonate the role or prove what its portal looks like yet.
            </p>
          </section>
        </div>
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

