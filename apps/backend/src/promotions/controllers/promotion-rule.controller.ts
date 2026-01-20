import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PromotionRuleService } from '../services/promotion-rule.service';
import { CreatePromotionRuleDto } from '../dto/create-promotion-rule.dto';
import { UpdatePromotionRuleDto } from '../dto/update-promotion-rule.dto';

@Controller('promotion-rules')
export class PromotionRuleController {
  constructor(private readonly ruleService: PromotionRuleService) {}

  @Post()
  create(@Body() dto: CreatePromotionRuleDto) {
    return this.ruleService.create(dto);
  }

  @Get()
  findAll() {
    return this.ruleService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePromotionRuleDto) {
    return this.ruleService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return { success: this.ruleService.remove(+id) };
  }
}
