$p = 'server\workspace\routes.ts'
$s = Get-Content $p -Raw

$s = $s.Replace(
"import { attendanceRecords, clients, employees, memberships, notifications, projects, projectAccess, reminders, salesActivities, salesLeads, workspaceInvitations, users } from '../db/app-schema'",
"import { attendanceRecords, clients, departments, employees, memberships, notifications, projects, projectAccess, reminders, salesActivities, salesLeads, workspaceInvitations, users } from '../db/app-schema'"
)

$marker = "workspaceRoutes.get('/invitations', async (req, res) => {"

$insert = @'
workspaceRoutes.get('/departments', async (req, res) => {
  try {
    const userId = requireUser(req)
    const workspaceId = typeof req.query.workspaceId === 'string' ? req.query.workspaceId.trim() : ''

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' })
    }

    const membership = await getMembership(userId, workspaceId)
    if (!membership) {
      return res.status(403).json({ error: 'Workspace access denied' })
    }

    const rows = await db.select({
      id: departments.id,
      workspaceId: departments.workspaceId,
      name: departments.name,
      code: departments.code,
      description: departments.description,
      managerUserId: departments.managerUserId,
      status: departments.status,
    })
      .from(departments)
      .where(eq(departments.workspaceId, workspaceId))
      .orderBy(departments.name)

    return res.json({ departments: rows })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch workspace departments' })
  }
})

'@

if ($s -notmatch "workspaceRoutes\.get\('/departments'") {
    $s = $s.Replace($marker, $insert + $marker)
    Set-Content $p $s -Encoding utf8
    Write-Host "Department API added."
} else {
    Write-Host "Department API already exists. No changes made."
}