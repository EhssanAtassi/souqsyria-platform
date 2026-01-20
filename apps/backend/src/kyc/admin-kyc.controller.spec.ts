import { Test, TestingModule } from '@nestjs/testing';
import { AdminKycController } from './admin-kyc.controller';

describe('AdminKycController', () => {
  let controller: AdminKycController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminKycController],
    }).compile();

    controller = module.get<AdminKycController>(AdminKycController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
