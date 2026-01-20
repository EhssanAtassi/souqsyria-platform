import { Test, TestingModule } from '@nestjs/testing';
import { PromotionRuleService } from './promotion-rule.service';

describe('PromotionRuleService', () => {
  let service: PromotionRuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromotionRuleService],
    }).compile();
    service = module.get(PromotionRuleService);
  });

  it('creates and retrieves a rule', () => {
    const rule = service.create({ type: 'min_order_total', value: 100 });
    expect(service.findAll()).toHaveLength(1);
    expect(service.findOne(rule.id)).toEqual(rule);
  });

  it('updates a rule', () => {
    const rule = service.create({ type: 'min_order_total', value: 100 });
    service.update(rule.id, { value: 200 });
    expect(service.findOne(rule.id)?.value).toBe(200);
  });

  it('removes a rule', () => {
    const rule = service.create({ type: 'min_order_total', value: 100 });
    service.remove(rule.id);
    expect(service.findAll()).toHaveLength(0);
  });
});
