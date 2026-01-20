import { Injectable } from '@nestjs/common';
import { PromotionRule } from '../entities/promotion-rule.entity';
import { CreatePromotionRuleDto } from '../dto/create-promotion-rule.dto';
import { UpdatePromotionRuleDto } from '../dto/update-promotion-rule.dto';

@Injectable()
export class PromotionRuleService {
  private rules: PromotionRule[] = [];
  private idCounter = 1;

  create(dto: CreatePromotionRuleDto): PromotionRule {
    const rule: PromotionRule = { id: this.idCounter++, ...dto };
    this.rules.push(rule);
    return rule;
  }

  findAll(): PromotionRule[] {
    return [...this.rules];
  }

  findOne(id: number): PromotionRule | undefined {
    return this.rules.find((rule) => rule.id === id);
  }

  update(id: number, dto: UpdatePromotionRuleDto): PromotionRule | undefined {
    const rule = this.findOne(id);
    if (!rule) {
      return undefined;
    }
    Object.assign(rule, dto);
    return rule;
  }

  remove(id: number): boolean {
    const index = this.rules.findIndex((rule) => rule.id === id);
    if (index === -1) {
      return false;
    }
    this.rules.splice(index, 1);
    return true;
  }
}
