
import {SetMetadata} from '@nestjs/common';
import {RoleEnum} from './role.enum';
//这个接口允许哪些角色访问
export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleEnum[]) => SetMetadata(ROLES_KEY, roles);
