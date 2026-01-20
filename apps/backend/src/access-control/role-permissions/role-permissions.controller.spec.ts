import { Test, TestingModule } from '@nestjs/testing';
import { RolePermissionsController } from './role-permissions.controller';

describe('RolePermissionsController', () => {
  let controller: RolePermissionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolePermissionsController],
    }).compile();

    controller = module.get<RolePermissionsController>(
      RolePermissionsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
