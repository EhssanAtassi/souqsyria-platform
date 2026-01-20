import { Test, TestingModule } from '@nestjs/testing';
import { RolePermissionsService } from './role-permissions.service';

describe('RolePermissionsService', () => {
  let service: RolePermissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolePermissionsService],
    }).compile();

    service = module.get<RolePermissionsService>(RolePermissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
