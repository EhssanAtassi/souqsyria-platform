/**
 * @file paginated-attributes-response.dto.ts
 * @description Response DTO for paginated attribute listings
 */
import { ApiProperty } from '@nestjs/swagger';
import { AttributeResponseDto } from './attribute-response.dto';

export class PaginatedAttributesResponseDto {
  @ApiProperty({
    description: 'Array of attributes',
    type: [AttributeResponseDto],
  })
  data: AttributeResponseDto[];

  @ApiProperty({
    description: 'Total number of attributes matching filters',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPrev: boolean;

  @ApiProperty({
    description: 'Number of items in current page',
    example: 20,
  })
  count: number;

  @ApiProperty({
    description: 'Additional metadata about the query',
    example: {
      query: {
        search: 'color',
        type: 'select',
        isActive: true,
        isFilterable: true,
        sortBy: 'displayOrder',
        sortOrder: 'ASC',
        language: 'en',
      },
      executionTime: 45,
      cacheHit: false,
    },
  })
  meta: {
    query: {
      search?: string;
      type?: string;
      isActive?: boolean;
      isFilterable?: boolean;
      sortBy: string;
      sortOrder: string;
      language: string;
    };
    executionTime: number;
    cacheHit: boolean;
  };
}
