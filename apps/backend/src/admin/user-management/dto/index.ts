/**
 * @file index.ts
 * @description Central export file for all User Management DTOs.
 *
 * This barrel export simplifies imports throughout the application:
 * Instead of: import { QueryUsersDto } from './dto/query-users.dto'
 * You can use: import { QueryUsersDto } from './dto'
 */

export { QueryUsersDto } from './query-users.dto';
export { UpdateUserDto } from './update-user.dto';
export { AssignRolesDto } from './assign-roles.dto';
export { BanUserDto } from './ban-user.dto';
export { SuspendUserDto } from './suspend-user.dto';
export { ResetPasswordDto } from './reset-password.dto';
