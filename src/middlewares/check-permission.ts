import { NextFunction, Request, Response } from 'express';
import { NotAuthorizedError } from '../error-handler';
import { RedisClientType } from 'redis';

interface PermissionList {
  roleId: number;
  permissions: string[];
}

export function checkPermission(redisClient: RedisClientType, name: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    let hasPermission = false;
    const context = 'check-permission.middleware.ts/checkPermission()';
    const roleId = req.currentUser?.roleId;
    if (!roleId) throw new NotAuthorizedError('Unauthorized', context);

    let rolePermissions = await redisClient.get('role-permissions');
    if (!rolePermissions?.length)
      throw new NotAuthorizedError('Unauthorized', context);

    const parsedRolePermissions: PermissionList[] = JSON.parse(rolePermissions);

    const userRolePermission = parsedRolePermissions.find((rolePermission) => {
      return rolePermission.roleId === roleId;
    })?.permissions;

    if (userRolePermission?.includes(name)) {
      hasPermission = true;
    }
    if (hasPermission) next();
    else throw new NotAuthorizedError('Unauthorized', context);
  };
}

export const withPermission = (
  permission: string,
  getRedisClient: () => RedisClientType
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const redis = getRedisClient();
    return checkPermission(redis, permission)(req, res, next);
  };
};
