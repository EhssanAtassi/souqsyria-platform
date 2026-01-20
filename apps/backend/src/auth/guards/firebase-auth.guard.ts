// src/auth/guards/firebase-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      console.error('Auth failed: Missing Authorization header');
      return false;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('Auth failed: Bearer token missing');
      return false;
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      // 🔍 Lookup the actual user from the database using firebaseUid
      const dbUser = await this.userRepo.findOne({
        where: { firebaseUid: decodedToken.uid },
        relations: ['role'], // include if needed
      });
      if (!dbUser) {
        console.error('Auth failed: Firebase user not found in DB');
        throw new UnauthorizedException('User not registered in platform');
      }
      request.user = {
        id: dbUser.id, // ✅ numeric DB ID
        email: dbUser.email,
        firebase_uid: dbUser.firebaseUid,
        phone: dbUser.phone,
        role_id: dbUser.role?.id,
      };
      return true;
    } catch (error) {
      console.error(
        'Auth failed: Firebase token invalid or expired',
        error?.message || error,
      );
      return false;
    }
  }
}
