/**
 * @file roles.decorator.ts
 * @description Custom decorator to declare required roles for a route or controller.
 */
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
