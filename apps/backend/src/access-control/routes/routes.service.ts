/**
 * @file routes.service.ts
 * @description Business logic for managing API routes and linking permissions dynamically.
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from '../entities/route.entity';
import { CreateRouteDto } from '../dto/route/create-route.dto';
import { UpdateRouteDto } from '../dto/route/update-route.dto';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,

    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createRouteDto: CreateRouteDto): Promise<Route> {
    const { path, method, permissionId } = createRouteDto;

    const route = new Route();
    route.path = path;
    route.method = method;

    if (permissionId) {
      const permission = await this.permissionRepository.findOne({
        where: { id: permissionId },
      });
      if (!permission) throw new NotFoundException('Permission not found');
      route.permission = permission;
    }

    const saved = await this.routeRepository.save(route);
    this.logger.log(`Route created: ${saved.path} [${saved.method}]`);
    return saved;
  }

  async findAll(): Promise<Route[]> {
    return this.routeRepository.find({ relations: ['permission'] });
  }

  async findOne(id: number): Promise<Route> {
    const route = await this.routeRepository.findOne({
      where: { id },
      relations: ['permission'],
    });
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  async update(id: number, updateRouteDto: UpdateRouteDto): Promise<Route> {
    const route = await this.findOne(id);
    Object.assign(route, updateRouteDto);

    if (updateRouteDto.permissionId !== undefined) {
      const permission = await this.permissionRepository.findOne({
        where: { id: updateRouteDto.permissionId },
      });
      if (!permission) throw new NotFoundException('Permission not found');
      route.permission = permission;
    }

    const updated = await this.routeRepository.save(route);
    this.logger.log(`Route updated: ${updated.path} [${updated.method}]`);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const route = await this.findOne(id);
    await this.routeRepository.remove(route);
    this.logger.log(`Route deleted: ID ${id}`);
  }
}
