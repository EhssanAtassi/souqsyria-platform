import { Test, TestingModule } from '@nestjs/testing';
import { StaffManagementController } from './staff-management.controller';

describe('StaffManagementController', () => {
  let controller: StaffManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffManagementController],
    }).compile();

    controller = module.get<StaffManagementController>(
      StaffManagementController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
