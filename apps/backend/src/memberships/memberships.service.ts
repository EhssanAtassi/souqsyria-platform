import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from './entities/membership.entity';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(Membership)
    private membershipRepository: Repository<Membership>,
  ) {}

  async findAll() {
    return this.membershipRepository.find();
  }

  async findOne(id: number) {
    return this.membershipRepository.findOne({ where: { id } });
  }
}
