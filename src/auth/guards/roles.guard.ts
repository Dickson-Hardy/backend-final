import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import type { UserRole } from "../../users/schemas/user.schema"
import { ROLES_KEY } from "../decorators/roles.decorator"

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    console.log('🔍 RolesGuard - requiredRoles:', requiredRoles)

    if (!requiredRoles) {
      console.log('🔍 RolesGuard - No roles required, allowing access')
      return true
    }

    const { user } = context.switchToHttp().getRequest()
    console.log('🔍 RolesGuard - user:', user?.email, 'role:', user?.role)
    
    const hasRole = requiredRoles.some((role) => user.role === role)
    console.log('🔍 RolesGuard - hasRole:', hasRole)
    
    return hasRole
  }
}
