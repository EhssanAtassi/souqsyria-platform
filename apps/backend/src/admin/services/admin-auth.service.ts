import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import * as crypto from 'crypto';

import { User } from '../../users/entities/user.entity';
import { RolePermission } from '../../access-control/entities/role-permission.entity';
import { TokenBlacklist } from '../../auth/entity/token-blacklist.entity';
import { AdminLoginDto } from '../dto/admin-login.dto';
import { AdminRefreshDto } from '../dto/admin-refresh.dto';
import { AdminLogoutDto } from '../dto/admin-logout.dto';

const ADMIN_ROLE_NAMES = [
  'super_admin',
  'admin',
  'moderator',
  'customer_service',
  'vendor_manager',
];

interface AdminTokenPayload {
  sub: number;
  email: string;
  role: string;
  permissions: string[];
  tokenType: 'access' | 'refresh';
}

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: AdminLoginDto, ipAddress?: string) {
    const { email, password } = dto;

    const admin = await this.userRepository.findOne({
      where: { email },
      relations: ['role', 'assignedRole'],
    });

    if (!admin || admin.deletedAt) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!admin.passwordHash) {
      throw new UnauthorizedException('Password login not enabled for this account.');
    }

    const isAdmin = this.isAdminUser(admin);
    if (!isAdmin) {
      throw new UnauthorizedException('Admin access is not enabled for this account.');
    }

    const passwordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (admin.isBanned) {
      throw new UnauthorizedException('This account is banned from admin access.');
    }

    const permissions = await this.resolvePermissions(admin);

    const { accessToken, refreshToken, expiresIn } = this.generateTokens(admin, permissions);

    admin.lastLoginAt = new Date();
    await this.userRepository.save(admin);

    return {
      accessToken,
      refreshToken,
      expiresIn,
      admin: this.toAdminProfile(admin, permissions),
    };
  }

  async refresh(dto: AdminRefreshDto) {
    const { refreshToken } = dto;
    let payload: AdminTokenPayload;

    try {
      payload = this.jwtService.verify<AdminTokenPayload>(refreshToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid token type.');
    }

    await this.ensureTokenNotBlacklisted(refreshToken);

    const admin = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['role', 'assignedRole'],
    });

    if (!admin || admin.deletedAt || !this.isAdminUser(admin)) {
      throw new UnauthorizedException('Admin account not available.');
    }

    const permissions = await this.resolvePermissions(admin);

    const { accessToken, refreshToken: newRefreshToken, expiresIn } =
      this.generateTokens(admin, permissions);

    await this.blacklistToken(refreshToken, admin.id, 'refresh_token_rotated');

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn,
      admin: this.toAdminProfile(admin, permissions),
    };
  }

  async logout(
    userId: number,
    authHeader?: string,
    dto?: AdminLogoutDto,
    ipAddress?: string,
  ) {
    const tokens: string[] = [];

    if (authHeader?.startsWith('Bearer ')) {
      tokens.push(authHeader.substring(7));
    }

    if (dto?.refreshToken) {
      tokens.push(dto.refreshToken);
    }

    for (const token of tokens) {
      await this.blacklistToken(token, userId, dto?.reason ?? 'logout', ipAddress);
    }

    return {
      message: 'Logged out successfully.',
    };
  }

  async getProfile(userId: number) {
    const admin = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'assignedRole'],
    });

    if (!admin || !this.isAdminUser(admin)) {
      throw new UnauthorizedException('Admin account not found.');
    }

    const permissions = await this.resolvePermissions(admin);

    return this.toAdminProfile(admin, permissions);
  }

  private isAdminUser(user: User): boolean {
    const candidate = user.assignedRole ?? user.role;
    if (!candidate) {
      return false;
    }

    if (candidate.type === 'admin') {
      return true;
    }

    return ADMIN_ROLE_NAMES.includes(candidate.name);
  }

  private async resolvePermissions(user: User): Promise<string[]> {
    const roleIds: number[] = [];
    if (user.role?.id) {
      roleIds.push(user.role.id);
    }
    if (user.assignedRole?.id && user.assignedRole.id !== user.role?.id) {
      roleIds.push(user.assignedRole.id);
    }

    if (!roleIds.length) {
      return [];
    }

    const rolePermissions = await this.rolePermissionRepository.find({
      where: {
        role: { id: In(roleIds) },
      },
      relations: ['permission'],
    });

    const permissions = new Set<string>();
    for (const rp of rolePermissions) {
      if (rp.permission?.name) {
        permissions.add(rp.permission.name);
      }
    }

    return Array.from(permissions);
  }

  private generateTokens(user: User, permissions: string[]) {
    const activeRole = user.assignedRole ?? user.role;
    const payloadBase = {
      sub: user.id,
      email: user.email,
      role: activeRole?.name ?? 'admin',
      permissions,
    };

    const accessToken = this.jwtService.sign({
      ...payloadBase,
      tokenType: 'access',
      jti: randomUUID(),
    });

    const refreshExpiresIn =
      this.configService.get<string>('ADMIN_REFRESH_EXPIRES_IN') ?? '7d';
    const refreshToken = this.jwtService.sign({
      ...payloadBase,
      tokenType: 'refresh',
      jti: randomUUID(),
    }, {
      expiresIn: refreshExpiresIn,
    });

    const decodedAccess = this.jwtService.decode(accessToken) as
      | { exp?: number; iat?: number }
      | undefined;
    const expiresIn = decodedAccess?.exp && decodedAccess?.iat
      ? decodedAccess.exp - decodedAccess.iat
      : 0;

    return { accessToken, refreshToken, expiresIn };
  }

  private toAdminProfile(user: User, permissions: string[]) {
    const activeRole = user.assignedRole ?? user.role;
    const [firstName, ...rest] = (user.fullName ?? user.email ?? '')
      .split(' ')
      .filter(Boolean);

    return {
      id: `admin_${user.id}`,
      email: user.email,
      firstName: firstName ?? 'Admin',
      lastName: rest.join(' ') || 'Team',
      role: activeRole?.name ?? 'admin',
      permissions,
      isActive: !user.isBanned && !user.isSuspended,
      phoneNumber: user.phone,
      department: user.metadata?.department,
      twoFactorEnabled: Boolean(user.metadata?.twoFactorEnabled),
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async ensureTokenNotBlacklisted(token: string) {
    const tokenHash = this.hashToken(token);
    const existing = await this.tokenBlacklistRepository.findOne({
      where: { tokenHash },
    });

    if (existing) {
      throw new UnauthorizedException('Token has been revoked.');
    }
  }

  private async blacklistToken(
    token: string,
    userId: number,
    reason = 'logout',
    ipAddress?: string,
  ) {
    if (!token) {
      return;
    }

    const tokenHash = this.hashToken(token);
    const decoded = this.jwtService.decode(token) as { exp?: number } | null;

    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 8 * 60 * 60 * 1000);

    await this.tokenBlacklistRepository
      .createQueryBuilder()
      .insert()
      .into(TokenBlacklist)
      .values({
        tokenHash,
        userId,
        expiresAt,
        reason,
        ipAddress,
      })
      .orIgnore()
      .execute();
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
