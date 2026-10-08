import { Request, Response, NextFunction } from 'express'; 
import { db } from '../db'; 
import { appUserRoles } from '../db/app-schema'; 
import { eq, and } from 'drizzle-orm'; 
 
export interface TenantRequest extends Request { 
  tenantContext?: { 
    userId: string; 
    workspaceId: string; 
    roleId: string; 
  }; 
} 
 
export const requireWorkspaceAccess = (requiredPermission?: string) => { 
  return async (req: TenantRequest, res: Response, next: NextFunction) => { 
    try { 
      const workspaceId = 
        (req.headers['x-workspace-id'] as string) || 
        (req.query.workspaceId as string) || 
        req.body?.workspaceId; 
 
      const userId = 
        (req.headers['x-user-id'] as string) || 
        (req.session as any)?.userId || 
        req.body?.userId; 
 
      if (!workspaceId || !userId) { 
        return res.status(400).json({ 
          ok: false, 
          error: { 
            code: 'MISSING_TENANT_CONTEXT', 
            message: 'Both User ID and Workspace ID are required for tenant verification.', 
          }, 
        }); 
      } 
 
      const membership = await db.query.appUserRoles.findFirst({ 
        where: and( 
          eq(appUserRoles.userId, userId), 
          eq(appUserRoles.workspaceId, workspaceId) 
        ), 
      }); 
 
      if (!membership) { 
        return res.status(403).json({ 
          ok: false, 
          error: { 
            code: 'FORBIDDEN_WORKSPACE_ACCESS', 
            message: 'Access denied: You are not a member of this workspace.', 
          }, 
        }); 
      } 
 
      req.tenantContext = { 
        userId, 
        workspaceId, 
        roleId: membership.roleId, 
      }; 
 
      next(); 
    } catch (error) { 
      console.error('Tenant Isolation Check Failed:', error); 
      return res.status(500).json({ 
        ok: false, 
        error: { 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'An error occurred during tenant authorization.', 
        }, 
      }); 
    } 
  }; 
}; 
