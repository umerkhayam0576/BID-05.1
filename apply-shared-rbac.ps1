
$ErrorActionPreference = 'Stop'

$entityPath = 'server\entity\routes.ts'
$workspacePath = 'server\workspace\routes.ts'
$sharedPath = 'server\auth\workspaceRbac.ts'

if (!(Test-Path $entityPath) -or !(Test-Path $workspacePath)) {
    throw 'Expected route files were not found. Run from C:\BidExact\BID-05.1.'
}
if (Test-Path $sharedPath) {
    throw "Shared module already exists: $sharedPath. No files changed."
}

$entity = [System.IO.File]::ReadAllText((Resolve-Path $entityPath))
$workspace = [System.IO.File]::ReadAllText((Resolve-Path $workspacePath))

$start = $entity.IndexOf('const defaultPermissionCatalog = [')
$end = $entity.IndexOf('export const entityRoutes = Router()')

if ($start -lt 0 -or $end -le $start) {
    throw 'Could not identify the existing RBAC code. No files changed.'
}

$rbac = $entity.Substring($start, $end - $start).TrimEnd()
$rbac = $rbac -replace "`r`n", "`n"

$rbac = $rbac.Replace(
    'async function initializeWorkspaceRbac(tx: any, workspaceId: string, ownerUserId: string)',
    'export async function initializeWorkspaceRbac(tx: any, workspaceId: string, ownerUserId?: string)'
)

$oldRoles = @'
  for (const role of defaultRoles) {
    await tx.insert(roles).values({
      workspaceId,
      name: role.name,
      code: role.code,
      scope: 'workspace',
      isSystemRole: true,
      status: 'active',
    }).onConflictDoNothing();
  }
'@ -replace "`r`n", "`n"

$newRoles = @'
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
'@ -replace "`r`n", "`n"

if (!$rbac.Contains($oldRoles)) {
    throw 'Could not safely locate the default-role insertion loop. No files changed.'
}
$rbac = $rbac.Replace($oldRoles, $newRoles)

$oldPermissions = @'
  for (const [roleCode, permissionCodes] of Object.entries(permissionCodesByRole)) {
    const roleRows = await tx.select({ id: roles.id }).from(roles).where(and(eq(roles.workspaceId, workspaceId), eq(roles.code, roleCode)));
    const role = roleRows[0];
    if (!role) throw new Error(`RBAC role ${roleCode} was not created`);

    for (const permissionCode of permissionCodes) {
      const permissionId = permissionByCode.get(permissionCode);
      if (!permissionId) throw new Error(`RBAC permission ${permissionCode} is missing`);
      await tx.insert(rolePermissions).values({
        roleId: role.id,
        permissionId,
      }).onConflictDoNothing();
    }

    if (roleCode === 'OWNER') {
      await tx.insert(userRoles).values({
        workspaceId,
        userId: ownerUserId,
        roleId: role.id,
        status: 'active',
      }).onConflictDoNothing();
    }
  }
'@ -replace "`r`n", "`n"

$newPermissions = @'
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
'@ -replace "`r`n", "`n"

if (!$rbac.Contains($oldPermissions)) {
    throw 'Could not safely locate the permission-mapping loop. No files changed.'
}
$rbac = $rbac.Replace($oldPermissions, $newPermissions)

if ($rbac -notmatch 'export async function initializeWorkspaceRbac') {
    throw 'Shared initializer export check failed. No files changed.'
}
if ($rbac -notmatch 'newlyCreatedRoleCodes\.has\(roleCode\)') {
    throw 'Permission-preservation check failed. No files changed.'
}

$sharedContent = @"
import { and, eq } from 'drizzle-orm'
import { departments, permissions, rolePermissions, roles, userRoles } from '../db/app-schema'

$rbac
"@

$newEntity = $entity.Substring(0, $start) + $entity.Substring($end)

if (!$newEntity.Contains("from '../auth/workspaceRbac'")) {
    $newEntity = $newEntity.Replace(
        "import { db } from '../db'",
        "import { db } from '../db'`r`nimport { initializeWorkspaceRbac } from '../auth/workspaceRbac'"
    )
}

if (!$workspace.Contains("from '../auth/workspaceRbac'")) {
    $workspace = $workspace.Replace(
        "import { db } from '../db'",
        "import { db } from '../db'`r`nimport { initializeWorkspaceRbac } from '../auth/workspaceRbac'"
    )
}

$lookupMarker = "      const roleCode = invitedRole === 'employee' ? 'EMPLOYEE' : 'CLIENT'"
if (!$workspace.Contains($lookupMarker)) {
    throw 'Invitation role lookup not found. No files changed.'
}

$workspace = $workspace.Replace(
    $lookupMarker,
    "      await initializeWorkspaceRbac(tx, claimed.workspaceId)`r`n`r`n" + $lookupMarker
)

if (!$newEntity.Contains("from '../auth/workspaceRbac'") -or
    !$workspace.Contains("from '../auth/workspaceRbac'")) {
    throw 'Could not prepare both shared-module imports. No files changed.'
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

[System.IO.File]::WriteAllText($sharedPath, $sharedContent, $utf8NoBom)
[System.IO.File]::WriteAllText((Resolve-Path $entityPath), $newEntity, $utf8NoBom)
[System.IO.File]::WriteAllText((Resolve-Path $workspacePath), $workspace, $utf8NoBom)

Write-Host 'Shared RBAC module created.'
Write-Host 'Both route modules updated.'
Write-Host 'Existing roles do not receive new default permission mappings.'
Write-Host 'Invitation acceptance calls the initializer without an owner user ID.'
Write-Host 'No database records were changed by this script.'
