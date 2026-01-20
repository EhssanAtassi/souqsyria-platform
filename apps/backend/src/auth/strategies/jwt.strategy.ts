/**
 * @file jwt.strategy.ts
 * @description Strategy to validate JWT tokens and extract user info for secured APIs.
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'), // ✅ use your env secret
    });
  }

  /**
   * Decodes the token payload and maps it to a user object.
   * Assumes that `sub` is the internal DB user ID (number).
   */
  async validate(payload: any) {
    return {
      id: payload.sub, // ✅ used throughout your app as user.id
      email: payload.email,
      role_id: payload.role_id ?? payload.role, // support both keys
    };
  }
}
