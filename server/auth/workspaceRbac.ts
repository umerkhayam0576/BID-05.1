import { and, eq } from 'drizzle-orm'
import { departments, permissions, rolePermissions, roles, userRoles } from '../db/app-schema'

const defaultPermissionCatalog = [
  { code: 'dashboard.view', name: 'View Dashboard', module: 'Dashboard', description: 'View the workspace dashboard and summary cards.' },
  { code: 'people.manage', name: 'Manage People', module: 'People', description: 'Manage users, roles, and access for the workspace.' },
  { code: 'people.view', name: 'View People', module: 'People', description: 'View employee and workspace user records.' },
  { code: 'clients.manage', name: 'Manage Clients', module: 'Clients', description: 'Create, edit, and manage client records.' },
  { code: 'clients.view', name: 'View Clients', module: 'Clients', description: 'View client records and profile information.' },
  { code: 'projects.view', name: 'View Projects', module: 'Projects', description: 'View project records and statuses.' },
  { code: 'projects.manage', name: 'Manage Projects', module: 'Projects', description: 'Create and manage project records and workflows.' },
  { code: 'services.view', name: 'View Services', module: 'Services', description: 'View the service catalog and delivery information.' },
  { code: 'services.manage', name: 'Manage Services', module: 'Services', description: 'Configure the service catalog and service operations.' },
  { code: 'finance.view', name: 'View Finance', module: 'Finance', description: 'View finance information and account summaries.' },
  { code: 'finance.manage', name: 'Manage Finance', module: 'Finance', description: 'Create and maintain finance records and settings.' },
  { code: 'expenses.view', name: 'View Expenses', module: 'Expenses', description: 'View expense records and approvals.' },
  { code: 'expenses.manage', name: 'Manage Expenses', module: 'Expenses', description: 'Create and update expense records.' },
  { code: 'payouts.view', name: 'View Payouts', module: 'Payouts', description: 'View payout records and status.' },
  { code: 'payouts.manage', name: 'Manage Payouts', module: 'Payouts', description: 'Create and approve payouts.' },
  { code: 'payroll.view', name: 'View Payroll', module: 'Payroll', description: 'View payroll information and pay history.' },
  { code: 'payroll.manage', name: 'Manage Payroll', module: 'Payroll', description: 'Manage payroll entries and compensation records.' },
  { code: 'employees.manage', name: 'Manage Employees', module: 'People', description: 'Manage employee records and assignments.' },
  { code: 'employees.view', name: 'View Employees', module: 'People', description: 'View employee profiles and assignments.' },
  { code: 'reports.view', name: 'View Reports', module: 'Reports', description: 'Access reports and analytics tiles.' },
  { code: 'sales.manage', name: 'Manage Sales', module: 'Sales', description: 'Manage sales opportunities and pipeline activity.' },
  { code: 'sales.view', name: 'View Sales', module: 'Sales', description: 'View sales pipeline and activity.' },
  { code: 'roles.manage', name: 'Manage Roles', module: 'Access Control', description: 'Create and update workspace roles and permissions.' },
  { code: 'portal.preview', name: 'Preview Portal', module: 'Access Control', description: 'Preview a role-based portal without granting real access.' },
  { code: 'security.audit', name: 'Audit Security', module: 'Access Control', description: 'Review access and authorization changes for the workspace.' },
] as const

async function ensureWorkspacePermissionCatalog(tx: any) {
  const existingRows = await tx.select({ id: permissions.id, code: permissions.code }).from(permissions)
  const existingCodes = new Set(existingRows.map((permission: any) => permission.code))

  for (const permission of defaultPermissionCatalog) {
    if (!existingCodes.has(permission.code)) {
      const [inserted] = await tx.insert(permissions).values({
        name: permission.name,
        code: permission.code,
        module: permission.module,
        description: permission.description,
      }).returning({ id: permissions.id, code: permissions.code })

      if (inserted) {
        existingCodes.add(inserted.code)
      }
    }
  }

  const refreshedRows = await tx.select({ id: permissions.id, code: permissions.code }).from(permissions)
  return new Map(refreshedRows.map((permission: any) => [permission.code, permission.id]))
}

export async function initializeWorkspaceRbac(tx: any, workspaceId: string, ownerUserId?: string) {
  const defaultDepartments = [
    { name: 'Sales', code: 'SALES', description: 'Sales and business development' },
    { name: 'Services', code: 'SERVICES', description: 'Service delivery and operations' },
    { name: 'HR', code: 'HR', description: 'Human resources and people operations' },
    { name: 'Accounting', code: 'ACCOUNTING', description: 'Accounting and financial operations' },
    { name: 'Management', code: 'MANAGEMENT', description: 'Management and administration' },
  ];

  for (const department of defaultDepartments) {
    await tx.insert(departments).values({
      workspaceId,
      name: department.name,
      code: department.code,
      description: department.description,
      status: 'active',
    }).onConflictDoNothing();
  }

  const defaultRoles = [
    { name: 'Owner', code: 'OWNER' },
    { name: 'Admin', code: 'ADMIN' },
    { name: 'Sales', code: 'SALES' },
    { name: 'Employee', code: 'EMPLOYEE' },
    { name: 'Finance', code: 'FINANCE' },
    { name: 'HR', code: 'HR' },
    { name: 'Client', code: 'CLIENT' },
  ];

  const newlyCreatedRoleCodes = new Set<string>();

  for (const role of defaultRoles) {
    const insertedRoles = await tx.insert(roles).values({
      workspaceId,
      name: role.name,
      code: role.code,
      scope: 'workspace',
      isSystemRole: true,
      status: 'active',
    }).onConflictDoNothing().returning({ code: roles.code });

    if (insertedRoles[0]) {
      newlyCreatedRoleCodes.add(insertedRoles[0].code);
    }
  }

  const permissionByCode = await ensureWorkspacePermissionCatalog(tx);

  const permissionCodesByRole: Record<string, string[]> = {
    OWNER: ['dashboard.view', 'people.manage', 'people.view', 'clients.manage', 'clients.view', 'projects.view', 'projects.manage', 'services.view', 'services.manage', 'finance.view', 'finance.manage', 'expenses.view', 'expenses.manage', 'payouts.view', 'payouts.manage', 'payroll.view', 'payroll.manage', 'employees.manage', 'employees.view', 'reports.view', 'sales.manage', 'sales.view', 'roles.manage', 'portal.preview', 'security.audit'],
    ADMIN: ['dashboard.view', 'people.manage', 'people.view', 'clients.manage', 'clients.view', 'projects.view', 'projects.manage', 'services.view', 'services.manage', 'finance.view', 'finance.manage', 'expenses.view', 'expenses.manage', 'payouts.view', 'payouts.manage', 'payroll.view', 'payroll.manage', 'employees.manage', 'employees.view', 'reports.view', 'sales.manage', 'sales.view', 'roles.manage', 'portal.preview', 'security.audit'],
    SALES: ['clients.manage', 'clients.view', 'dashboard.view', 'projects.view', 'reports.view', 'sales.manage', 'sales.view'],
    EMPLOYEE: ['dashboard.view', 'expenses.view', 'projects.view', 'services.view'],
    FINANCE: ['dashboard.view', 'expenses.manage', 'expenses.view', 'finance.manage', 'finance.view', 'payouts.manage', 'payouts.view', 'payroll.manage', 'payroll.view', 'reports.view'],
    HR: ['dashboard.view', 'employees.manage', 'employees.view', 'payroll.manage', 'payroll.view', 'reports.view'],
    CLIENT: ['dashboard.view', 'projects.view', 'services.view'],
  };

  for (const [roleCode, permissionCodes] of Object.entries(permissionCodesByRole)) {
    const roleRows = await tx.select({ id: roles.id }).from(roles).where(and(eq(roles.workspaceId, workspaceId), eq(roles.code, roleCode)));
    const role = roleRows[0];
    if (!role) throw new Error(`RBAC role ${roleCode} was not created`);

    if (newlyCreatedRoleCodes.has(roleCode)) {
      for (const permissionCode of permissionCodes) {
        const permissionId = permissionByCode.get(permissionCode);
        if (!permissionId) throw new Error(`RBAC permission ${permissionCode} is missing`);
        await tx.insert(rolePermissions).values({
          roleId: role.id,
          permissionId,
        }).onConflictDoNothing();
      }
    }

    if (roleCode === 'OWNER' && ownerUserId) {
      await tx.insert(userRoles).values({
        workspaceId,
        userId: ownerUserId,
        roleId: role.id,
        status: 'active',
      }).onConflictDoNothing();
    }
  }
}

async function syncMembershipToRbac(tx: any, workspaceId: string, userId: string, membershipRole: string) {
  const roleCodeByMembership: Record<string, string> = {
    owner: 'OWNER',
    admin: 'ADMIN',
    manager: 'ADMIN',
    member: 'EMPLOYEE',
    employee: 'EMPLOYEE',
    sales: 'SALES',
    finance: 'FINANCE',
    hr: 'HR',
    client: 'CLIENT',
  };

  const roleCode = roleCodeByMembership[membershipRole.toLowerCase()];
  if (!roleCode) return null;

  const roleRows = await tx.select({ id: roles.id }).from(roles).where(and(
    eq(roles.workspaceId, workspaceId),
    eq(roles.code, roleCode),
    eq(roles.status, 'active'),
  )).limit(1);

  const role = roleRows[0];
  if (!role) return null;

  await tx.insert(userRoles).values({
    workspaceId,
    userId,
    roleId: role.id,
    status: 'active',
  }).onConflictDoNothing();

  return role;
}