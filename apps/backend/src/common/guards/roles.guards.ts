/**
 * @file roles.guard.ts
 * @description Guard that restricts access to users with specific roles (e.g., admin).
 * Reads role from MySQL user linked to Firebase UID.
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../users/users.service';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true; // No role required
    }

    const request = context.switchToHttp().getRequest();
    const firebaseUser = request.user; // From FirebaseAuthGuard

    if (!firebaseUser) {
      throw new ForbiddenException('User not authenticated');
    }

    const user =
      await this.usersService.findOrCreateByFirebaseUid(firebaseUser);

    this.logger.log(
      `User ID: ${user.id} Role: ${user.role.name} Requested Roles: ${requiredRoles.join(', ')}`,
    );

    if (!user.role || !requiredRoles.includes(user.role.name)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
