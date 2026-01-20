import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ProductionLoggerService } from './common/services/logger.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly productionLogger: ProductionLoggerService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('/test-audit')
  // No guards here = public endpoint
  testAudit() {
    this.productionLogger.info('TEST: This should appear in log file');
    return { message: 'Testing audit' };
  }
}
