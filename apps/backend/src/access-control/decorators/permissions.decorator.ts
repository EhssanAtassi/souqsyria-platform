/**
 * @file permissions.decorator.ts
 * @description Custom decorator to specify required permissions for an endpoint.
 */
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
