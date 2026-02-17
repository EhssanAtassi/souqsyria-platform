import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginLog } from './entity/login-log.entity';
import { EmailService } from './service/email.service';
import { TokenBlacklist } from './entity/token-blacklist.entity';
import { RefreshToken } from './entity/refresh-token.entity';
import { SecurityAudit } from './entity/security-audit.entity';

// Guest Session (SS-AUTH-009)
import { GuestSession } from '../cart/entities/guest-session.entity';
import { GuestSessionService } from './service/guest-session.service';
import { GuestSessionGuard } from './guards/guest-session.guard';
import { GuestSessionController } from './controller/guest-session.controller';

// Common services
import { EncryptionService } from '../common/utils/encryption.util';
import { RateLimiterService } from '../common/services/rate-limiter.service';

@Global()
@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([
      User,
      Role,
      LoginLog,
      TokenBlacklist,
      RefreshToken,
      SecurityAudit,
      GuestSession,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN') || '15m',
          issuer: 'souqsyria-api',
          audience: 'souqsyria-client',
        },
      }),
    }),
    ConfigModule,
  ],
  controllers: [AuthController, GuestSessionController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    EmailService,
    EncryptionService,
    RateLimiterService,
    GuestSessionService,
    GuestSessionGuard,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    GuestSessionService,
    GuestSessionGuard,
    TypeOrmModule,
  ],
})
export class AuthModule {}
