import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredPermissions) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    // 这里可以根据用户的角色和权限进行检查
    // 示例：检查用户是否具有所需的权限
    return requiredPermissions.some(permission => 
      this.hasPermission(user, permission)
    );
  }

  private hasPermission(user: any, permission: string): boolean {
    // 这里实现具体的权限检查逻辑
    // 可以根据用户的角色和分配的权限进行判断
    // 示例实现：
    if (!user.roleRef || !user.roleRef.rolePermissions) {
      return false;
    }

    // 检查角色是否拥有指定权限
    return user.roleRef.rolePermissions.some((rolePermission: any) => 
      rolePermission.permission && 
      (rolePermission.permission.name === permission || 
       rolePermission.permission.resource === permission.split(':')[0])
    );
  }
}