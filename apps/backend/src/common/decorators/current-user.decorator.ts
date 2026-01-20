/**
 * @file current-user.decorator.ts
 * @description This custom NestJS decorator extracts the Firebase user
 *              from the request object after it has been validated by the FirebaseAuthGuard.
 *
 * ✅ Why we need it:
 * - It provides a clean way to access the authenticated user in any controller method.
 * - Avoids repeating `request.user` logic in every controller.
 *
 * ✅ How it works:
 * - Reads `request.user` set by `FirebaseAuthGuard` (after Firebase token verification).
 * - Can be used in any route handler like: `@CurrentUser() user`
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
