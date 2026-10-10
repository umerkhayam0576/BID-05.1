
$ErrorActionPreference = 'Stop'

$path = 'server\workspace\routes.ts'

if (-not (Test-Path -LiteralPath $path)) {
    throw "STOP: Source file not found: $path"
}

$content = [System.IO.File]::ReadAllText(
    (Resolve-Path -LiteralPath $path).Path
)

$importLine = "import { and, desc, eq, isNull, or, inArray } from 'drizzle-orm'"
$marker = "workspaceRoutes.get('/invitations', async (req, res) => {"
$routeMarker = "workspaceRoutes.post('/invitations/:id/accept'"

if ($content.Contains($routeMarker)) {
    throw 'STOP: Acceptance route already exists. No changes made.'
}

if (-not $content.Contains($importLine)) {
    throw 'STOP: Expected Drizzle import was not found. No changes made.'
}

if (-not $content.Contains($marker)) {
    throw 'STOP: Invitation-list insertion point was not found. No changes made.'
}

$backup = 'server\workspace\routes.ts.before-invitation-acceptance-implementation'

if (Test-Path -LiteralPath $backup) {
    throw "STOP: Backup already exists: $backup. No changes made."
}

$route = @'
workspaceRoutes.post('/invitations/:id/accept', async (req, res) => {
  try {
    const userId = requireUser(req)
    const invitationId = typeof req.params.id === 'string' ? req.params.id.trim() : ''
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : ''

    if (!invitationId || !token) {
      return res.status(400).json({ error: 'Invitation ID and token are required' })
    }

    const tokenHash = hashSessionToken(token)
    const invitationRows = await db.select().from(workspaceInvitations)
      .where(and(
        eq(workspaceInvitations.id, invitationId),
        eq(workspaceInvitations.tokenHash, tokenHash),
      ))
      .limit(1)

    const invitation = invitationRows[0]

    if (!invitation) {
      return res.status(400).json({ error: 'Invalid invitation or token' })
    }

    if (invitation.status !== 'pending') {
      return res.status(409).json({ error: 'Invitation is no longer pending' })
    }

    if (new Date(invitation.expiresAt).getTime() <= Date.now()) {
      await db.update(workspaceInvitations)
        .set({ status: 'expired' })
        .where(and(
          eq(workspaceInvitations.id, invitation.id),
          eq(workspaceInvitations.status, 'pending'),
        ))
      return res.status(410).json({ error: 'Invitation has expired' })
    }

    const userRows = await db.select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      status: users.status,
    }).from(users).where(eq(users.id, userId)).limit(1)

    const user = userRows[0]

    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'An active user account is required' })
    }

    if (normalizeEmail(user.email) !== normalizeEmail(invitation.email)) {
      return res.status(403).json({
        error: 'Sign in with the email address that received this invitation',
      })
    }

    const invitedRole = String(invitation.role).toLowerCase()

    if (invitedRole !== 'employee' && invitedRole !== 'client') {
      return res.status(400).json({ error: 'Unsupported invitation role' })
    }

    const result = await db.transaction(async (tx: any) => {
      const claimedRows = await tx.update(workspaceInvitations)
        .set({
          status: 'accepted',
          acceptedByUserId: userId,
          acceptedAt: new Date(),
        })
        .where(and(
          eq(workspaceInvitations.id, invitation.id),
          eq(workspaceInvitations.tokenHash, tokenHash),
          eq(workspaceInvitations.status, 'pending'),
          gt(workspaceInvitations.expiresAt, new Date()),
        ))
        .returning({
          workspaceId: workspaceInvitations.workspaceId,
          role: workspaceInvitations.role,
          department: workspaceInvitations.department,
          portalRole: workspaceInvitations.portalRole,
          name: workspaceInvitations.name,
          email: workspaceInvitations.email,
        })

      const claimed = claimedRows[0]

      if (!claimed) {
        const error: any = new Error('Invitation was already used or has expired')
        error.status = 409
        throw error
      }

      const membershipRows = await tx.select()
        .from(memberships)
        .where(and(
          eq(memberships.workspaceId, claimed.workspaceId),
          eq(memberships.userId, userId),
        ))
        .limit(1)

      const membership = membershipRows[0]

      if (membership && (
        membership.status !== 'active' ||
        String(membership.role).toLowerCase() !== invitedRole
      )) {
        const error: any = new Error(
          'An existing workspace membership conflicts with this invitation'
        )
        error.status = 409
        throw error
      }

      if (!membership) {
        await tx.insert(memberships).values({
          workspaceId: claimed.workspaceId,
          userId,
          role: invitedRole,
          status: 'active',
        })
      }

      const roleCode = invitedRole === 'employee' ? 'EMPLOYEE' : 'CLIENT'

      const roleRows = await tx.select({
        id: roles.id,
      }).from(roles).where(and(
        eq(roles.workspaceId, claimed.workspaceId),
        eq(roles.code, roleCode),
        eq(roles.status, 'active'),
      )).limit(1)

      const workspaceRole = roleRows[0]

      if (!workspaceRole) {
        const error: any = new Error(
          'The required workspace role is not configured'
        )
        error.status = 500
        throw error
      }

      await tx.insert(userRoles).values({
        workspaceId: claimed.workspaceId,
        userId,
        roleId: workspaceRole.id,
        status: 'active',
      }).onConflictDoNothing()

      if (invitedRole === 'employee') {
        const employeeRows = await tx.select({
          id: employees.id,
          userId: employees.userId,
        }).from(employees).where(and(
          eq(employees.workspaceId, claimed.workspaceId),
          or(
            eq(employees.userId, userId),
            eq(employees.email, user.email),
          ),
        )).limit(1)

        const employee = employeeRows[0]
        const employeeValues = {
          userId,
          name: claimed.name || user.displayName,
          department: claimed.department || null,
          portalRole: claimed.portalRole || null,
          email: user.email,
          status: 'active',
        }

        if (employee) {
          await tx.update(employees)
            .set(employeeValues)
            .where(and(
              eq(employees.id, employee.id),
              eq(employees.workspaceId, claimed.workspaceId),
            ))
        } else {
          await tx.insert(employees).values({
            workspaceId: claimed.workspaceId,
            ...employeeValues,
          })
        }
      } else {
        const clientRows = await tx.select({
          id: clients.id,
        }).from(clients).where(and(
          eq(clients.workspaceId, claimed.workspaceId),
          eq(clients.email, user.email),
        )).limit(1)

        const client = clientRows[0]
        const clientValues = {
          name: claimed.name || user.displayName,
          email: user.email,
          ownerUserId: userId,
          status: 'active',
        }

        if (client) {
          await tx.update(clients)
            .set(clientValues)
            .where(and(
              eq(clients.id, client.id),
              eq(clients.workspaceId, claimed.workspaceId),
            ))
        } else {
          await tx.insert(clients).values({
            workspaceId: claimed.workspaceId,
            ...clientValues,
          })
        }
      }

      return {
        workspaceId: claimed.workspaceId,
        role: invitedRole,
      }
    })

    return res.json({ accepted: true, ...result })
  } catch (error: any) {
    const status = error?.status ||
      (error?.message === 'Permission denied' ? 403 : 500)

    return res.status(status).json({
      error: error?.message || 'Failed to accept invitation',
    })
  }
})

'@

$updated = $content.Replace(
    $importLine,
    "import { and, desc, eq, gt, isNull, or, inArray } from 'drizzle-orm'"
)

$updated = $updated.Replace(
    $marker,
    $route + "`r`n" + $marker
)

Copy-Item -LiteralPath $path -Destination $backup

try {
    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText(
        (Resolve-Path -LiteralPath $path).Path,
        $updated,
        $encoding
    )
    Write-Output 'SUCCESS: Invitation acceptance route inserted.'
    Write-Output "Backup created: $backup"
} catch {
    Copy-Item -LiteralPath $backup -Destination $path -Force
    throw
}
