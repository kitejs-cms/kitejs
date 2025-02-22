import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayloadModel } from '../models/payload-jwt.model';
import { RolesService } from '../../users/services/roles.service';
import { PERMISSIONS_KEY } from '../../../common';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly rolesService: RolesService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[] | string>(
      PERMISSIONS_KEY,
      context.getHandler()
    );

    if (!requiredPermissions) return true;

    const request = context.switchToHttp().getRequest();
    const user: JwtPayloadModel = request.user;
    if (!user) return false;

    const allRoles = await this.rolesService.findRoles();

    const requiredPermissionsArray = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    const aggregatedPermissions = new Set<string>(user.permissions || []);

    if (user.roles && Array.isArray(user.roles)) {
      const userRoles = allRoles.filter((role) =>
        user.roles.includes(role.name)
      );

      userRoles.forEach((role) => {
        role.permissions.forEach((perm) => aggregatedPermissions.add(perm));
      });
    }

    const hasPermission = requiredPermissionsArray.some((perm) =>
      aggregatedPermissions.has(perm)
    );

    return hasPermission;
  }
}
