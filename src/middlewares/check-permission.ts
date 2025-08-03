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
    const roles = req.currentUser?.roles;
    if (!roles?.length) throw new NotAuthorizedError('Unauthorized', context);

    let permissions = await redisClient.get('role-permissions');
    if (!permissions?.length)
      throw new NotAuthorizedError('Unauthorized', context);

    const parsedPermissions: PermissionList[] = JSON.parse(permissions);

    for (let role of roles) {
      const filteredPermission = parsedPermissions.find(() => {
        return roles.includes(role);
      })?.permissions;

      if (filteredPermission?.includes(name)) {
        hasPermission = true;
        break;
      }
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
