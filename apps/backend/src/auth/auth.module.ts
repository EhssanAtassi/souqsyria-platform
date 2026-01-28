import { Module } from '@nestjs/common';
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
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { LoginLog } from './entity/login-log.entity';
import { EmailService } from './service/email.service';
import { TokenBlacklist } from './entity/token-blacklist.entity';
import { RefreshToken } from './entity/refresh-token.entity';

// Common services
import { EncryptionService } from '../common/utils/encryption.util';
import { RateLimiterService } from '../common/services/rate-limiter.service';

// Seeding Components
import { AuthSeederService } from './seeds/auth-seeder.service';
import { AuthSeederController } from './seeds/auth-seeder.controller';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([
      User,
      Role,
      LoginLog,
      TokenBlacklist,
      RefreshToken,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') },
      }),
    }),
    ConfigModule,
  ],
  controllers: [AuthController, AuthSeederController],
  providers: [
    AuthService,
    AuthSeederService,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    EmailService,
    EncryptionService,
    RateLimiterService,
  ],
  exports: [AuthService, AuthSeederService],
})
export class AuthModule {}
