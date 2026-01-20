import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attribute } from './entities/attribute.entity';
import { AttributeValue } from './entities/attribute-value.entity';
import { AttributesService } from './attributes.service';
import { AttributeValuesService } from './services/attribute-values.service';
import { AttributesController } from './attributes.controller';
import { AttributeSeederService } from './seeds/attribute-seeder.service';
import { AttributeSeederController } from './seeds/attribute-seeder.controller';
import { User } from '../users/entities/user.entity';
import { Route } from '../access-control/entities/route.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attribute, AttributeValue, User, Route])],
  controllers: [AttributesController, AttributeSeederController],
  providers: [
    AttributesService,
    AttributeValuesService,
    AttributeSeederService,
  ],
  exports: [
    TypeOrmModule,
    AttributesService,
    AttributeValuesService,
    AttributeSeederService,
  ],
})
export class AttributesModule {}
