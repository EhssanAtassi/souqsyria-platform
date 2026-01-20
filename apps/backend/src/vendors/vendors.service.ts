import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendorEntity } from './entities/vendor.entity';
import { VendorMembershipEntity } from './entities/vendor-membership.entity';
import { SyrianVendorService } from './services/syrian-vendor.service';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(VendorEntity)
    private vendorRepository: Repository<VendorEntity>,
    @InjectRepository(VendorMembershipEntity)
    private vendorMembershipRepository: Repository<VendorMembershipEntity>,
    private syrianVendorService: SyrianVendorService,
  ) {}

  // Legacy methods for backward compatibility
  async findAll() {
    return this.vendorRepository.find();
  }

  async findOne(id: number) {
    return this.vendorRepository.findOne({ where: { id } });
  }

  // Delegate Syrian vendor operations to specialized service
  async createSyrianVendor(createVendorDto: any) {
    return this.syrianVendorService.createSyrianVendor(createVendorDto);
  }

  async findSyrianVendorById(id: number) {
    return this.syrianVendorService.findSyrianVendorById(id);
  }

  async updateSyrianVendor(id: number, updateVendorDto: any) {
    return this.syrianVendorService.updateSyrianVendor(id, updateVendorDto);
  }

  async searchSyrianVendors(searchQuery: any) {
    return this.syrianVendorService.searchSyrianVendors(searchQuery);
  }

  async performBulkVendorActions(bulkActionDto: any, executorId: number) {
    return this.syrianVendorService.performBulkVendorActions(
      bulkActionDto,
      executorId,
    );
  }

  async getVendorStatistics() {
    return this.syrianVendorService.getVendorStatistics();
  }
}
