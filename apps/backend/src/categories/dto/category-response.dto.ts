import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryBreadcrumbDto } from './category-breadcrumb.dto';

export class CategoryParentDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Electronics' })
  name: string;

  @ApiProperty({ example: 'electronics' })
  slug: string;
}

export class CategoryChildDto {
  @ApiProperty({ example: 2 })
  id: number;

  @ApiProperty({ example: 'Smartphones' })
  name: string;

  @ApiProperty({ example: 'smartphones' })
  slug: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 25 })
  productCount: number;
}

export class CategoryResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Electronics' })
  nameEn: string;

  @ApiProperty({ example: 'إلكترونيات' })
  nameAr: string;

  @ApiProperty({ example: 'Electronics' })
  name: string;

  @ApiProperty({ example: 'electronics' })
  slug: string;

  @ApiPropertyOptional({ example: 'Electronic devices' })
  descriptionEn?: string;

  @ApiPropertyOptional({ example: 'أجهزة إلكترونية' })
  descriptionAr?: string;

  @ApiPropertyOptional({ example: 'Electronic devices' })
  description?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.souqsyria.com/icons/electronics.svg',
  })
  iconUrl?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.souqsyria.com/banners/electronics.jpg',
  })
  bannerUrl?: string;

  @ApiPropertyOptional({ example: '#2196F3' })
  themeColor?: string;

  @ApiPropertyOptional({ example: 'Electronics - Buy Online | SouqSyria' })
  seoTitle?: string;

  @ApiPropertyOptional({ example: 'Shop electronics with fast delivery' })
  seoDescription?: string;

  @ApiPropertyOptional({ example: 'الكترونيات' })
  seoSlug?: string;

  @ApiProperty({ example: 'approved' })
  approvalStatus: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isFeatured: boolean;

  @ApiProperty({ example: true })
  showInNav: boolean;

  @ApiProperty({ example: 0 })
  depthLevel: number;

  @ApiPropertyOptional({ example: 'Electronics' })
  categoryPath?: string;

  @ApiProperty({ example: 100 })
  sortOrder: number;

  @ApiPropertyOptional({ example: 5.5 })
  commissionRate?: number;

  @ApiPropertyOptional({ example: 1000 })
  minPrice?: number;

  @ApiPropertyOptional({ example: 1000000 })
  maxPrice?: number;

  @ApiProperty({ example: 156 })
  productCount: number;

  @ApiProperty({ example: 2341 })
  viewCount: number;

  @ApiProperty({ example: 87.5 })
  popularityScore: number;

  @ApiPropertyOptional()
  lastActivityAt?: Date;

  @ApiPropertyOptional({ example: 1 })
  createdBy?: number;

  @ApiPropertyOptional({ example: 1 })
  updatedBy?: number;

  @ApiPropertyOptional({ example: 2 })
  approvedBy?: number;

  @ApiPropertyOptional()
  approvedAt?: Date;

  @ApiPropertyOptional({ example: 'Category name needs improvement' })
  rejectionReason?: string;

  @ApiPropertyOptional({ example: 1 })
  tenantId?: number;

  @ApiPropertyOptional({ example: 'syria-main' })
  organizationId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ example: 'Electronics' })
  displayName: string;

  @ApiPropertyOptional({ example: 'Electronic devices' })
  displayDescription?: string;

  @ApiProperty({ example: '/en/categories/electronics' })
  url: string;

  @ApiProperty({ example: true })
  isPublic: boolean;

  @ApiProperty({ example: false })
  canBeEdited: boolean;

  @ApiProperty({ example: true })
  isRootCategory: boolean;

  @ApiProperty({ example: true })
  hasChildren: boolean;

  @ApiProperty({ example: false })
  needsAdminAttention: boolean;

  @ApiPropertyOptional({ type: CategoryParentDto })
  parent?: CategoryParentDto;

  @ApiPropertyOptional({ type: [CategoryChildDto] })
  children?: CategoryChildDto[];

  @ApiPropertyOptional({ type: [CategoryBreadcrumbDto] })
  breadcrumbs?: CategoryBreadcrumbDto[];
}
