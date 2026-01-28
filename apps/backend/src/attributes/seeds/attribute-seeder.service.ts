/**
 * @file attribute-seeder.service.ts
 * @description Professional attribute seeding service for product attributes and values
 *
 * Provides comprehensive seeding capabilities for:
 * - Common e-commerce attributes (Color, Size, Brand, etc.)
 * - Product specifications (Weight, Dimensions, Material)
 * - Technical attributes (Storage, Memory, Features)
 * - Multi-language support (Arabic/English)
 * - Performance optimization and validation
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attribute } from '../entities/attribute.entity';
import { AttributeValue } from '../entities/attribute-value.entity';
import { AttributeType } from '../entities/attribute-types.enum';

interface AttributeSeedData {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  type: AttributeType;
  displayOrder: number;
  isRequired: boolean;
  isFilterable: boolean;
  isSearchable: boolean;
  validationRules?: any;
  values: Array<{
    valueEn: string;
    valueAr: string;
    displayOrder: number;
    colorHex?: string;
    iconUrl?: string;
    metadata?: any;
  }>;
}

@Injectable()
export class AttributeSeederService {
  private readonly logger = new Logger(AttributeSeederService.name);

  constructor(
    @InjectRepository(Attribute)
    private readonly attributeRepository: Repository<Attribute>,
    @InjectRepository(AttributeValue)
    private readonly attributeValueRepository: Repository<AttributeValue>,
  ) {}

  /**
   * Comprehensive attribute seed data for e-commerce platform
   */
  private getAttributeSeedData(): AttributeSeedData[] {
    return [
      // 1. Color Attribute
      {
        nameEn: 'Color',
        nameAr: 'اللون',
        descriptionEn: 'Product color options',
        descriptionAr: 'خيارات ألوان المنتج',
        type: AttributeType.COLOR,
        displayOrder: 1,
        isRequired: false,
        isFilterable: true,
        isSearchable: true,
        values: [
          {
            valueEn: 'Red',
            valueAr: 'أحمر',
            displayOrder: 1,
            colorHex: '#FF0000',
          },
          {
            valueEn: 'Blue',
            valueAr: 'أزرق',
            displayOrder: 2,
            colorHex: '#0000FF',
          },
          {
            valueEn: 'Green',
            valueAr: 'أخضر',
            displayOrder: 3,
            colorHex: '#008000',
          },
          {
            valueEn: 'Black',
            valueAr: 'أسود',
            displayOrder: 4,
            colorHex: '#000000',
          },
          {
            valueEn: 'White',
            valueAr: 'أبيض',
            displayOrder: 5,
            colorHex: '#FFFFFF',
          },
          {
            valueEn: 'Yellow',
            valueAr: 'أصفر',
            displayOrder: 6,
            colorHex: '#FFFF00',
          },
          {
            valueEn: 'Purple',
            valueAr: 'بنفسجي',
            displayOrder: 7,
            colorHex: '#800080',
          },
          {
            valueEn: 'Orange',
            valueAr: 'برتقالي',
            displayOrder: 8,
            colorHex: '#FFA500',
          },
          {
            valueEn: 'Pink',
            valueAr: 'وردي',
            displayOrder: 9,
            colorHex: '#FFC0CB',
          },
          {
            valueEn: 'Brown',
            valueAr: 'بني',
            displayOrder: 10,
            colorHex: '#A52A2A',
          },
        ],
      },

      // 2. Size Attribute
      {
        nameEn: 'Size',
        nameAr: 'الحجم',
        descriptionEn: 'Product size options',
        descriptionAr: 'خيارات حجم المنتج',
        type: AttributeType.SELECT,
        displayOrder: 2,
        isRequired: false,
        isFilterable: true,
        isSearchable: true,
        values: [
          {
            valueEn: 'Extra Small (XS)',
            valueAr: 'صغير جداً',
            displayOrder: 1,
          },
          { valueEn: 'Small (S)', valueAr: 'صغير', displayOrder: 2 },
          { valueEn: 'Medium (M)', valueAr: 'متوسط', displayOrder: 3 },
          { valueEn: 'Large (L)', valueAr: 'كبير', displayOrder: 4 },
          {
            valueEn: 'Extra Large (XL)',
            valueAr: 'كبير جداً',
            displayOrder: 5,
          },
          {
            valueEn: 'Double XL (XXL)',
            valueAr: 'كبير جداً جداً',
            displayOrder: 6,
          },
          {
            valueEn: 'Triple XL (XXXL)',
            valueAr: 'كبير للغاية',
            displayOrder: 7,
          },
        ],
      },

      // 3. Brand Attribute
      {
        nameEn: 'Brand',
        nameAr: 'العلامة التجارية',
        descriptionEn: 'Product brand or manufacturer',
        descriptionAr: 'علامة تجارية أو شركة مصنعة للمنتج',
        type: AttributeType.SELECT,
        displayOrder: 3,
        isRequired: true,
        isFilterable: true,
        isSearchable: true,
        values: [
          { valueEn: 'Samsung', valueAr: 'سامسونغ', displayOrder: 1 },
          { valueEn: 'Apple', valueAr: 'أبل', displayOrder: 2 },
          { valueEn: 'Huawei', valueAr: 'هواوي', displayOrder: 3 },
          { valueEn: 'Xiaomi', valueAr: 'شاومي', displayOrder: 4 },
          { valueEn: 'Sony', valueAr: 'سوني', displayOrder: 5 },
          { valueEn: 'LG', valueAr: 'إل جي', displayOrder: 6 },
          { valueEn: 'Nike', valueAr: 'نايك', displayOrder: 7 },
          { valueEn: 'Adidas', valueAr: 'أديداس', displayOrder: 8 },
          { valueEn: 'Zara', valueAr: 'زارا', displayOrder: 9 },
          { valueEn: 'H&M', valueAr: 'إتش آند إم', displayOrder: 10 },
        ],
      },

      // 4. Material Attribute
      {
        nameEn: 'Material',
        nameAr: 'المادة',
        descriptionEn: 'Product material composition',
        descriptionAr: 'تركيب مادة المنتج',
        type: AttributeType.SELECT,
        displayOrder: 4,
        isRequired: false,
        isFilterable: true,
        isSearchable: true,
        values: [
          { valueEn: 'Cotton', valueAr: 'قطن', displayOrder: 1 },
          { valueEn: 'Polyester', valueAr: 'بوليستر', displayOrder: 2 },
          { valueEn: 'Wool', valueAr: 'صوف', displayOrder: 3 },
          { valueEn: 'Silk', valueAr: 'حرير', displayOrder: 4 },
          { valueEn: 'Linen', valueAr: 'كتان', displayOrder: 5 },
          { valueEn: 'Leather', valueAr: 'جلد', displayOrder: 6 },
          { valueEn: 'Plastic', valueAr: 'بلاستيك', displayOrder: 7 },
          { valueEn: 'Metal', valueAr: 'معدن', displayOrder: 8 },
          { valueEn: 'Wood', valueAr: 'خشب', displayOrder: 9 },
          { valueEn: 'Glass', valueAr: 'زجاج', displayOrder: 10 },
        ],
      },

      // 5. Storage Capacity (for electronics)
      {
        nameEn: 'Storage Capacity',
        nameAr: 'سعة التخزين',
        descriptionEn: 'Device storage capacity',
        descriptionAr: 'سعة تخزين الجهاز',
        type: AttributeType.SELECT,
        displayOrder: 5,
        isRequired: false,
        isFilterable: true,
        isSearchable: true,
        values: [
          { valueEn: '16GB', valueAr: '16 جيجابايت', displayOrder: 1 },
          { valueEn: '32GB', valueAr: '32 جيجابايت', displayOrder: 2 },
          { valueEn: '64GB', valueAr: '64 جيجابايت', displayOrder: 3 },
          { valueEn: '128GB', valueAr: '128 جيجابايت', displayOrder: 4 },
          { valueEn: '256GB', valueAr: '256 جيجابايت', displayOrder: 5 },
          { valueEn: '512GB', valueAr: '512 جيجابايت', displayOrder: 6 },
          { valueEn: '1TB', valueAr: '1 تيرابايت', displayOrder: 7 },
          { valueEn: '2TB', valueAr: '2 تيرابايت', displayOrder: 8 },
        ],
      },

      // 6. Features (multi-select)
      {
        nameEn: 'Features',
        nameAr: 'المميزات',
        descriptionEn: 'Product features and capabilities',
        descriptionAr: 'مميزات وقدرات المنتج',
        type: AttributeType.MULTISELECT,
        displayOrder: 6,
        isRequired: false,
        isFilterable: true,
        isSearchable: true,
        values: [
          { valueEn: 'Waterproof', valueAr: 'مقاوم للماء', displayOrder: 1 },
          { valueEn: 'Wireless', valueAr: 'لاسلكي', displayOrder: 2 },
          { valueEn: 'Bluetooth', valueAr: 'بلوتوث', displayOrder: 3 },
          { valueEn: 'Wi-Fi', valueAr: 'واي فاي', displayOrder: 4 },
          { valueEn: 'GPS', valueAr: 'نظام تحديد المواقع', displayOrder: 5 },
          { valueEn: 'Fast Charging', valueAr: 'شحن سريع', displayOrder: 6 },
          {
            valueEn: 'Fingerprint Scanner',
            valueAr: 'ماسح بصمة',
            displayOrder: 7,
          },
          {
            valueEn: 'Face Recognition',
            valueAr: 'تعرف على الوجه',
            displayOrder: 8,
          },
          { valueEn: 'Dual Camera', valueAr: 'كاميرا مزدوجة', displayOrder: 9 },
          { valueEn: 'NFC', valueAr: 'اتصال قريب المدى', displayOrder: 10 },
        ],
      },

      // 7. Weight
      {
        nameEn: 'Weight',
        nameAr: 'الوزن',
        descriptionEn: 'Product weight in grams',
        descriptionAr: 'وزن المنتج بالجرام',
        type: AttributeType.NUMBER,
        displayOrder: 7,
        isRequired: false,
        isFilterable: true,
        isSearchable: false,
        validationRules: {
          min: 0,
          max: 100000, // 100kg max
        },
        values: [], // No predefined values for numeric inputs
      },

      // 8. Warranty Period
      {
        nameEn: 'Warranty',
        nameAr: 'الضمان',
        descriptionEn: 'Product warranty duration',
        descriptionAr: 'مدة ضمان المنتج',
        type: AttributeType.SELECT,
        displayOrder: 8,
        isRequired: false,
        isFilterable: true,
        isSearchable: false,
        values: [
          { valueEn: 'No Warranty', valueAr: 'بدون ضمان', displayOrder: 1 },
          { valueEn: '3 Months', valueAr: '3 أشهر', displayOrder: 2 },
          { valueEn: '6 Months', valueAr: '6 أشهر', displayOrder: 3 },
          { valueEn: '1 Year', valueAr: 'سنة واحدة', displayOrder: 4 },
          { valueEn: '2 Years', valueAr: 'سنتان', displayOrder: 5 },
          { valueEn: '3 Years', valueAr: '3 سنوات', displayOrder: 6 },
          { valueEn: '5 Years', valueAr: '5 سنوات', displayOrder: 7 },
          { valueEn: 'Lifetime', valueAr: 'مدى الحياة', displayOrder: 8 },
        ],
      },

      // 9. Condition
      {
        nameEn: 'Condition',
        nameAr: 'الحالة',
        descriptionEn: 'Product condition status',
        descriptionAr: 'حالة المنتج',
        type: AttributeType.SELECT,
        displayOrder: 9,
        isRequired: true,
        isFilterable: true,
        isSearchable: true,
        values: [
          { valueEn: 'New', valueAr: 'جديد', displayOrder: 1 },
          { valueEn: 'Like New', valueAr: 'مثل الجديد', displayOrder: 2 },
          { valueEn: 'Very Good', valueAr: 'جيد جداً', displayOrder: 3 },
          { valueEn: 'Good', valueAr: 'جيد', displayOrder: 4 },
          { valueEn: 'Fair', valueAr: 'مقبول', displayOrder: 5 },
          { valueEn: 'Poor', valueAr: 'ضعيف', displayOrder: 6 },
          { valueEn: 'Refurbished', valueAr: 'مجدد', displayOrder: 7 },
        ],
      },

      // 10. Age Group
      {
        nameEn: 'Age Group',
        nameAr: 'الفئة العمرية',
        descriptionEn: 'Target age group for the product',
        descriptionAr: 'الفئة العمرية المستهدفة للمنتج',
        type: AttributeType.SELECT,
        displayOrder: 10,
        isRequired: false,
        isFilterable: true,
        isSearchable: true,
        values: [
          {
            valueEn: 'Newborn (0-3 months)',
            valueAr: 'حديث الولادة (0-3 أشهر)',
            displayOrder: 1,
          },
          {
            valueEn: 'Baby (3-12 months)',
            valueAr: 'رضيع (3-12 شهر)',
            displayOrder: 2,
          },
          {
            valueEn: 'Toddler (1-3 years)',
            valueAr: 'طفل صغير (1-3 سنوات)',
            displayOrder: 3,
          },
          {
            valueEn: 'Kids (4-12 years)',
            valueAr: 'أطفال (4-12 سنة)',
            displayOrder: 4,
          },
          {
            valueEn: 'Teen (13-17 years)',
            valueAr: 'مراهق (13-17 سنة)',
            displayOrder: 5,
          },
          {
            valueEn: 'Adult (18+ years)',
            valueAr: 'بالغ (18+ سنة)',
            displayOrder: 6,
          },
          {
            valueEn: 'Senior (65+ years)',
            valueAr: 'كبار السن (65+ سنة)',
            displayOrder: 7,
          },
        ],
      },
    ];
  }

  /**
   * Seed attributes with comprehensive data
   */
  async seedAttributes(): Promise<{
    success: boolean;
    attributesCreated: number;
    valuesCreated: number;
    errors: string[];
  }> {
    this.logger.log('🌱 Starting attributes seeding...');

    const results = {
      success: true,
      attributesCreated: 0,
      valuesCreated: 0,
      errors: [],
    };

    try {
      const seedData = this.getAttributeSeedData();

      for (const attributeData of seedData) {
        try {
          // Check if attribute already exists
          const existingAttribute = await this.attributeRepository.findOne({
            where: { nameEn: attributeData.nameEn },
            relations: ['values'],
          });

          let attribute: Attribute;

          if (existingAttribute) {
            this.logger.log(
              `📝 Updating existing attribute: ${attributeData.nameEn}`,
            );
            // Update existing attribute
            await this.attributeRepository.update(existingAttribute.id, {
              nameAr: attributeData.nameAr,
              descriptionEn: attributeData.descriptionEn,
              descriptionAr: attributeData.descriptionAr,
              type: attributeData.type,
              displayOrder: attributeData.displayOrder,
              isRequired: attributeData.isRequired,
              isFilterable: attributeData.isFilterable,
              isSearchable: attributeData.isSearchable,
              validationRules: attributeData.validationRules,
            });
            attribute = existingAttribute;
          } else {
            this.logger.log(
              `✨ Creating new attribute: ${attributeData.nameEn}`,
            );
            // Create new attribute
            attribute = this.attributeRepository.create({
              nameEn: attributeData.nameEn,
              nameAr: attributeData.nameAr,
              descriptionEn: attributeData.descriptionEn,
              descriptionAr: attributeData.descriptionAr,
              type: attributeData.type,
              displayOrder: attributeData.displayOrder,
              isRequired: attributeData.isRequired,
              isFilterable: attributeData.isFilterable,
              isSearchable: attributeData.isSearchable,
              validationRules: attributeData.validationRules,
              isActive: true,
            });

            attribute = await this.attributeRepository.save(attribute);
            results.attributesCreated++;
          }

          // Seed attribute values
          for (const valueData of attributeData.values) {
            const existingValue = await this.attributeValueRepository.findOne({
              where: {
                attributeId: attribute.id,
                valueEn: valueData.valueEn,
              },
            });

            if (!existingValue) {
              const attributeValue = this.attributeValueRepository.create({
                attributeId: attribute.id,
                valueEn: valueData.valueEn,
                valueAr: valueData.valueAr,
                displayOrder: valueData.displayOrder,
                colorHex: valueData.colorHex,
                iconUrl: valueData.iconUrl,
                metadata: valueData.metadata,
                isActive: true,
              });

              await this.attributeValueRepository.save(attributeValue);
              results.valuesCreated++;
            }
          }
        } catch (error: unknown) {
          const errorMsg = `Failed to seed attribute ${attributeData.nameEn}: ${(error as Error).message}`;
          this.logger.error(errorMsg);
          results.errors.push(errorMsg);
          results.success = false;
        }
      }

      this.logger.log(
        `✅ Attributes seeding completed: ${results.attributesCreated} attributes, ${results.valuesCreated} values created`,
      );
    } catch (error: unknown) {
      this.logger.error('❌ Attributes seeding failed:', error);
      results.success = false;
      results.errors.push((error as Error).message);
    }

    return results;
  }

  /**
   * Clean up attributes (for testing)
   */
  async cleanupAttributes(): Promise<{ success: boolean; deleted: number }> {
    this.logger.log('🧹 Cleaning up attributes...');

    try {
      // Delete all attribute values first (due to foreign key constraints)
      const valuesDeleted = await this.attributeValueRepository.delete({});

      // Delete all attributes
      const attributesDeleted = await this.attributeRepository.delete({});

      this.logger.log(
        `✅ Cleanup completed: ${attributesDeleted.affected} attributes, ${valuesDeleted.affected} values deleted`,
      );

      return {
        success: true,
        deleted: attributesDeleted.affected || 0,
      };
    } catch (error: unknown) {
      this.logger.error('❌ Cleanup failed:', error);
      return {
        success: false,
        deleted: 0,
      };
    }
  }

  /**
   * Get seeding statistics
   */
  async getStatistics(): Promise<{
    totalAttributes: number;
    totalValues: number;
    attributesByType: Record<string, number>;
    activeAttributes: number;
  }> {
    const [totalAttributes, totalValues, activeAttributes] = await Promise.all([
      this.attributeRepository.count(),
      this.attributeValueRepository.count(),
      this.attributeRepository.count({ where: { isActive: true } }),
    ]);

    const attributesByType = await this.attributeRepository
      .createQueryBuilder('attribute')
      .select('attribute.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('attribute.type')
      .getRawMany()
      .then((results) =>
        results.reduce((acc, item) => {
          acc[item.type] = parseInt(item.count);
          return acc;
        }, {}),
      );

    return {
      totalAttributes,
      totalValues,
      attributesByType,
      activeAttributes,
    };
  }

  /**
   * Validate seeded data integrity
   */
  async validateSeededData(): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check for attributes without values (where values are expected)
      const attributesWithoutValues = await this.attributeRepository
        .createQueryBuilder('attr')
        .leftJoin('attr.values', 'values')
        .where('attr.type IN (:...types)', {
          types: [
            AttributeType.SELECT,
            AttributeType.MULTISELECT,
            AttributeType.COLOR,
          ],
        })
        .andWhere('values.id IS NULL')
        .getMany();

      if (attributesWithoutValues.length > 0) {
        issues.push(
          `${attributesWithoutValues.length} attributes have no values but require them`,
        );
        recommendations.push(
          'Add values to attributes of type SELECT, MULTISELECT, or COLOR',
        );
      }

      // Check for duplicate attribute names
      const duplicateNames = await this.attributeRepository
        .createQueryBuilder('attr')
        .select('attr.nameEn')
        .addSelect('COUNT(*)', 'count')
        .groupBy('attr.nameEn')
        .having('COUNT(*) > 1')
        .getRawMany();

      if (duplicateNames.length > 0) {
        issues.push(`${duplicateNames.length} duplicate attribute names found`);
        recommendations.push('Ensure all attribute names are unique');
      }

      // Check for missing translations
      const missingTranslations = await this.attributeRepository
        .createQueryBuilder('attr')
        .where('attr.nameAr IS NULL OR attr.nameAr = ""')
        .orWhere('attr.descriptionAr IS NULL OR attr.descriptionAr = ""')
        .getCount();

      if (missingTranslations > 0) {
        issues.push(
          `${missingTranslations} attributes missing Arabic translations`,
        );
        recommendations.push('Add Arabic translations for all attributes');
      }
    } catch (error: unknown) {
      issues.push(`Validation failed: ${(error as Error).message}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }
}
