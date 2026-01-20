/**
 * @file jwt-auth.guard.ts
 * @description Guard to protect private routes by validating JWT tokens.
 */
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
