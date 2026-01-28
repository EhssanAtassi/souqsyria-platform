import { Test, TestingModule } from '@nestjs/testing';
import { AdminKycController } from './admin-kyc.controller';
import { KycService } from './kyc.service';
import { UsersService } from '../users/users.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guards';

describe('AdminKycController', () => {
  let controller: AdminKycController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminKycController],
      providers: [
        {
          provide: KycService,
          useValue: {
            getPendingKycSubmissions: jest.fn(),
            approveKyc: jest.fn(),
            rejectKyc: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOrCreateByFirebaseUid: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminKycController>(AdminKycController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
