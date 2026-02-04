import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StaffManagementService } from './staff-management.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { ActivityLog } from '../access-control/entities/activity-log.entity';

describe('StaffManagementService', () => {
  let service: StaffManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffManagementService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StaffManagementService>(StaffManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
