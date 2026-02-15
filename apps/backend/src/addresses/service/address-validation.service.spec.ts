/**
 * @file address-validation.service.spec.ts
 * @description Unit tests for AddressValidationService
 *
 * Tests cover:
 * - Service instantiation
 * - validateSyrianPhone - Validates Syrian phone number formats
 * - validateSyrianPostalCode - Validates Syrian postal code formats
 * - calculateDistance - Haversine distance calculation
 *
 * @author SouqSyria Development Team
 * @version 1.0.0 - MVP1 God Service Refactor
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AddressValidationService } from './address-validation.service';
import { Address } from '../entities/address.entity';

describe('AddressValidationService', () => {
  let service: AddressValidationService;

  beforeEach(async () => {
    const mockAddressRepo = {
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressValidationService,
        {
          provide: getRepositoryToken(Address),
          useValue: mockAddressRepo,
        },
      ],
    }).compile();

    service = module.get<AddressValidationService>(AddressValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateSyrianPhone', () => {
    it('should accept valid international format with dashes', () => {
      expect(service.validateSyrianPhone('+963-11-123456')).toBe(true);
      expect(service.validateSyrianPhone('+963-11-1234567')).toBe(true);
    });

    it('should accept valid local format with dashes', () => {
      expect(service.validateSyrianPhone('011-123456')).toBe(true);
      expect(service.validateSyrianPhone('011-1234567')).toBe(true);
    });

    it('should accept valid international compact format', () => {
      expect(service.validateSyrianPhone('+963111234567')).toBe(true);
      expect(service.validateSyrianPhone('+96311123456')).toBe(true);
    });

    it('should reject invalid phone formats', () => {
      expect(service.validateSyrianPhone('123456')).toBe(false);
      expect(service.validateSyrianPhone('+1-555-1234567')).toBe(false);
      expect(service.validateSyrianPhone('')).toBe(false);
    });
  });

  describe('validateSyrianPostalCode', () => {
    it('should accept valid Syrian postal codes', () => {
      expect(service.validateSyrianPostalCode('11000')).toBe(true);
      expect(service.validateSyrianPostalCode('21500')).toBe(true);
      expect(service.validateSyrianPostalCode('31200')).toBe(true);
    });

    it('should reject postal codes with invalid region prefix', () => {
      expect(service.validateSyrianPostalCode('99000')).toBe(false);
      expect(service.validateSyrianPostalCode('00123')).toBe(false);
    });

    it('should reject postal codes with wrong length', () => {
      expect(service.validateSyrianPostalCode('1100')).toBe(false);
      expect(service.validateSyrianPostalCode('110001')).toBe(false);
      expect(service.validateSyrianPostalCode('')).toBe(false);
    });

    it('should reject non-numeric postal codes', () => {
      expect(service.validateSyrianPostalCode('abcde')).toBe(false);
      expect(service.validateSyrianPostalCode('11ab0')).toBe(false);
    });
  });

  describe('calculateDistance', () => {
    it('should return 0 for same coordinates', () => {
      const distance = service.calculateDistance(33.5, 36.3, 33.5, 36.3);
      expect(distance).toBe(0);
    });

    it('should calculate approximate distance between Damascus and Aleppo', () => {
      // Damascus: ~33.51, 36.28 | Aleppo: ~36.20, 37.13
      const distance = service.calculateDistance(33.51, 36.28, 36.20, 37.13);
      // Approximate distance is ~300-350 km
      expect(distance).toBeGreaterThan(280);
      expect(distance).toBeLessThan(380);
    });

    it('should return a positive distance for any two different points', () => {
      const distance = service.calculateDistance(32.0, 35.0, 37.0, 42.0);
      expect(distance).toBeGreaterThan(0);
    });
  });
});
