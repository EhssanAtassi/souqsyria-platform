/**
 * @file get-user.decorator.ts
 * @description Custom decorator to extract user information from request object
 *
 * This decorator extracts the authenticated user from the request object
 * after authentication guards have validated the user.
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

/**
 * GetUser decorator to extract authenticated user from request
 *
 * Usage:
 * @GetUser() user: User
 * @GetUser('id') userId: number
 * @GetUser('email') email: string
 */
export const GetUser = createParamDecorator(
  (data: string, ctx: ExecutionContext): User | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
