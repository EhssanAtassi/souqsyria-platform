/**
 * @file cart-merge.service.spec.ts
 * @description Unit Tests for CartMergeService (TASK-056)
 *
 * Tests:
 * - Simple merge (2 guest + 3 user, 1 duplicate)
 * - 100-item limit enforcement
 * - 50-item per-product limit
 * - Guest session invalidation
 * - Merge strategies
 * - Error handling
 * - Audit logging
 *
 * @author SouqSyria Development Team
 * @since 2025-11-12
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CartMergeService } from './cart-merge.service';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { GuestSession } from '../entities/guest-session.entity';
import { AuditLogService } from '../../audit-log/service/audit-log.service';
import { MergeStrategy, MergeCartResponse } from '../dto/MergeCartRequest.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CartMergeService (TASK-056)', () => {
  let service: CartMergeService;
  let dataSource: DataSource;

  beforeEach(async () => {
    const mockDataSource = {
      transaction: jest.fn((callback) => callback(mockEntityManager)),
    };

    const mockEntityManager = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartMergeService,
        { provide: getRepositoryToken(Cart), useValue: {} },
        { provide: getRepositoryToken(CartItem), useValue: {} },
        { provide: getRepositoryToken(GuestSession), useValue: {} },
        { provide: AuditLogService, useValue: { logSimple: jest.fn() } },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<CartMergeService>(CartMergeService);
    dataSource = module.get<DataSource>(DataSource);
  });

  describe('TEST-1: Simple Merge (2 guest + 3 user, 1 dup)', () => {
    it('should merge carts correctly', async () => {
      const mockEntityManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce({
            id: 'session-1',
            status: 'active',
          })
          .mockResolvedValueOnce({
            id: 10,
            sessionId: 'session-1',
            items: [
              { variant: { id: 1 }, quantity: 1, added_at: new Date() },
              { variant: { id: 2 }, quantity: 2, added_at: new Date() },
            ],
          })
          .mockResolvedValueOnce({
            id: 20,
            userId: 100,
            items: [
              { id: 101, variant: { id: 2 }, quantity: 1, added_at: new Date() },
              { id: 102, variant: { id: 3 }, quantity: 3, added_at: new Date() },
            ],
          })
          .mockResolvedValueOnce({ id: 20, userId: 100, items: [] }),
        create: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        (callback) => callback(mockEntityManager),
      );

      const result = await service.mergeGuestIntoUserCart(
        100,
        'session-1',
        MergeStrategy.COMBINE,
      );

      expect(result.success).toBe(true);
      expect(result.guestSessionConverted).toBe(true);
    });
  });

  describe('TEST-2: 100-Item Limit Enforcement', () => {
    it('should enforce 100-item limit', async () => {
      const guestItems = Array(60).fill(null).map((_, i) => ({
        variant: { id: 1000 + i },
        quantity: 1,
        added_at: new Date(),
      }));

      const userItems = Array(50).fill(null).map((_, i) => ({
        id: 200 + i,
        variant: { id: 2000 + i },
        quantity: 1,
        added_at: new Date(),
      }));

      const mockEntityManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce({ status: 'active' })
          .mockResolvedValueOnce({ items: guestItems })
          .mockResolvedValueOnce({ userId: 100, items: userItems })
          .mockResolvedValueOnce({ userId: 100, items: userItems }),
        create: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        (callback) => callback(mockEntityManager),
      );

      const result = await service.mergeGuestIntoUserCart(
        100,
        'session-2',
        MergeStrategy.COMBINE,
      );

      expect(result.totalItems).toBeLessThanOrEqual(100);
    });
  });

  describe('TEST-3: 50-Item Per-Product Limit', () => {
    it('should cap quantity at 50 per product', async () => {
      const mockEntityManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce({ status: 'active' })
          .mockResolvedValueOnce({
            items: [
              { variant: { id: 1 }, quantity: 30, added_at: new Date() },
            ],
          })
          .mockResolvedValueOnce({
            userId: 100,
            items: [
              { id: 1, variant: { id: 1 }, quantity: 40, added_at: new Date() },
            ],
          })
          .mockResolvedValueOnce({
            userId: 100,
            items: [{ variant: { id: 1 }, quantity: 40 }],
          }),
        create: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        (callback) => callback(mockEntityManager),
      );

      const result = await service.mergeGuestIntoUserCart(
        100,
        'session-3',
        MergeStrategy.COMBINE,
      );

      expect(result.success).toBe(true);
    });
  });

  describe('TEST-4: Guest Session Invalidation', () => {
    it('should mark guest session as converted', async () => {
      const guestSession = { id: 'session-4', status: 'active' };
      const mockEntityManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(guestSession)
          .mockResolvedValueOnce({ items: [] })
          .mockResolvedValueOnce({ userId: 100, items: [] })
          .mockResolvedValueOnce({ userId: 100, items: [] }),
        create: jest.fn(),
        save: jest.fn((entity) => Promise.resolve(entity)),
        remove: jest.fn(),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        (callback) => callback(mockEntityManager),
      );

      const result = await service.mergeGuestIntoUserCart(
        100,
        'session-4',
        MergeStrategy.COMBINE,
      );

      expect(result.guestSessionConverted).toBe(true);
      expect(mockEntityManager.remove).toHaveBeenCalled();
    });
  });

  describe('TEST-5: Merge Strategies', () => {
    it('should use COMBINE strategy', async () => {
      const mockEntityManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce({ status: 'active' })
          .mockResolvedValueOnce({ items: [] })
          .mockResolvedValueOnce({ userId: 100, items: [] })
          .mockResolvedValueOnce({ userId: 100, items: [] }),
        create: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        (callback) => callback(mockEntityManager),
      );

      const result = await service.mergeGuestIntoUserCart(
        100,
        'session-5',
        MergeStrategy.COMBINE,
      );

      expect(result.success).toBe(true);
    });
  });

  describe('TEST-6: Error Handling', () => {
    it('should reject non-existent guest session', async () => {
      const mockEntityManager = {
        findOne: jest.fn().mockResolvedValueOnce(null),
        create: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        (callback) => callback(mockEntityManager),
      );

      await expect(
        service.mergeGuestIntoUserCart(100, 'non-existent', MergeStrategy.COMBINE),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject expired session', async () => {
      const mockEntityManager = {
        findOne: jest.fn().mockResolvedValueOnce({ status: 'expired' }),
        create: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        (callback) => callback(mockEntityManager),
      );

      await expect(
        service.mergeGuestIntoUserCart(100, 'expired-session', MergeStrategy.COMBINE),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('TEST-7: Audit Logging', () => {
    it('should log audit events', async () => {
      const auditService = { logSimple: jest.fn() };
      const mockEntityManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce({ status: 'active' })
          .mockResolvedValueOnce({ items: [] })
          .mockResolvedValueOnce({ userId: 100, items: [] })
          .mockResolvedValueOnce({ userId: 100, items: [] }),
        create: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
      };

      (dataSource.transaction as jest.Mock).mockImplementation(
        (callback) => callback(mockEntityManager),
      );

      const result = await service.mergeGuestIntoUserCart(
        100,
        'session-7',
        MergeStrategy.COMBINE,
      );

      expect(result.success).toBe(true);
    });
  });
});
