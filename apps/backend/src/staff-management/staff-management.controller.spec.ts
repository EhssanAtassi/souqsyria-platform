import { Test, TestingModule } from '@nestjs/testing';
import { StaffManagementController } from './staff-management.controller';
import { StaffManagementService } from './staff-management.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';

describe('StaffManagementController', () => {
  let controller: StaffManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffManagementController],
      providers: [
        {
          provide: StaffManagementService,
          useValue: {
            createStaff: jest.fn(),
            findAllStaff: jest.fn(),
            updateStaffRole: jest.fn(),
            deactivateStaff: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<StaffManagementController>(
      StaffManagementController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
