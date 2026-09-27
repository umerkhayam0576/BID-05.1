import type { AppRole } from './middleware'

export function toAppRole(role: string): AppRole {
  const allowed: AppRole[] = ['owner', 'admin', 'manager', 'sales', 'finance', 'hr', 'employee', 'client']
  return allowed.includes(role as AppRole) ? role as AppRole : 'employee'
}

export function maskPersonName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'Employee'
  return parts.map((part) => part[0]).join('').toUpperCase().slice(0, 3)
}

export function projectClientView(client: any, role: AppRole) {
  if (role === 'client' || role === 'employee') {
    return { id: client.id, status: client.status }
  }

  return {
    id: client.id,
    name: client.name,
    company: client.company,
    email: client.email,
    phone: client.phone,
    status: client.status,
    ownerUserId: client.ownerUserId,
  }
}

export function projectEmployeeView(employee: any, role: AppRole) {
  if (role === 'client') {
    return {
      id: employee.id,
      employeeNumber: employee.employeeNumber,
      displayName: maskPersonName(employee.name),
      department: employee.department,
      title: employee.title,
      status: employee.status,
    }
  }

  return {
    id: employee.id,
    userId: employee.userId,
    employeeNumber: employee.employeeNumber,
    name: employee.name,
    department: employee.department,
    title: employee.title,
    email: employee.email,
    status: employee.status,
    managerUserId: employee.managerUserId,
  }
}
