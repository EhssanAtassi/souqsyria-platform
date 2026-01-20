import { Test, TestingModule } from '@nestjs/testing';
import { StaffManagementService } from './staff-management.service';

describe('StaffManagementService', () => {
  let service: StaffManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StaffManagementService],
    }).compile();

    service = module.get<StaffManagementService>(StaffManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
