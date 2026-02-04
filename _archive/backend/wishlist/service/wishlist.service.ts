import {
  Injectable,
  ConflictException,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// Must be provided in module
import { randomUUID } from 'crypto';
import { Wishlist } from '../entities/wishlist.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';
import { User } from '../../users/entities/user.entity';
import { CartService } from '../../cart/service/cart.service';
import { CreateCartItemDto } from '../../cart/dto/CreateCartItem.dto';

@Injectable()
export class WishlistService {
  private readonly logger = new Logger(WishlistService.name);

  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepo: Repository<Wishlist>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepo: Repository<ProductVariant>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject(CartService)
    private readonly cartService: CartService, // For move-to-cart logic
  ) {}

  /**
   * Add a product or variant to the user's wishlist.
   * Prevents duplicates.
   */
  async addToWishlist(
    user: User,
    productId: number,
    productVariantId?: number,
  ): Promise<Wishlist> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    let productVariant: ProductVariant = null;
    if (productVariantId) {
      productVariant = await this.productVariantRepo.findOne({
        where: { id: productVariantId, product: { id: product.id } },
      });
      if (!productVariant)
        throw new NotFoundException(
          'Product variant not found for this product',
        );
    }

    const where = {
      user: { id: user.id },
      product: { id: product.id },
      productVariant: productVariant ? { id: productVariant.id } : null,
    };
    const existing = await this.wishlistRepo.findOne({ where })!;
    if (existing) throw new ConflictException('Already in wishlist');

    const item = this.wishlistRepo.create({ user, product, productVariant });
    const saved = await this.wishlistRepo.save(item);
    this.logger.log(
      `Wishlist added for user ${user.id}, product ${product.id}, variant ${productVariant?.id}`,
    );
    return saved;
  }

  /**
   * Get all wishlist items for a user, including products and variants.
   */
  async getWishlist(user: User): Promise<Wishlist[]> {
    return this.wishlistRepo.find({
      where: { user: { id: user.id } },
      relations: ['product', 'productVariant'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Remove a product or variant from user's wishlist.
   */
  async removeFromWishlist(
    user: User,
    productId: number,
    productVariantId?: number,
  ): Promise<void> {
    const where = {
      user: { id: user.id },
      product: { id: productId },
      productVariant: productVariantId ? { id: productVariantId } : null,
    };
    const item = await this.wishlistRepo.findOne({ where })!;
    if (!item) throw new NotFoundException('Wishlist item not found');
    await this.wishlistRepo.remove(item);
    this.logger.log(
      `Wishlist removed for user ${user.id}, product ${productId}, variant ${productVariantId}`,
    );
  }

  /**
   * Move a wishlist item (by ID) to the user's cart and remove from wishlist.
   * Uses CartService to add item by variant (required).
   */
  async moveToCart(user: User, wishlistId: number, quantity = 1) {
    const item = await this.wishlistRepo.findOne({
      where: { id: wishlistId, user: { id: user.id } },
      relations: ['product', 'productVariant'],
    });
    if (!item) throw new NotFoundException('Wishlist item not found');

    // Only allow move to cart if variant exists (your cart is variant-based)
    if (!item.productVariant) {
      throw new NotFoundException(
        'Wishlist item has no associated product variant',
      );
    }

    // Convert User entity to UserFromToken for CartService
    const userFromToken = {
      id: user.id,
      email: user.email || (user as any).email || null,
      role_id: user.role?.id ?? (user as any).role_id ?? null,
      firebase_uid: user.firebaseUid || (user as any).firebase_uid || null,
    };

    // Prepare DTO for addItemToCart
    const dto: CreateCartItemDto = {
      variant_id: item.productVariant.id,
      quantity,
      price_discounted: item.productVariant.price ?? null,
      expires_at: null,
      added_from_campaign: null,
    };

    await this.cartService.addItemToCart(userFromToken, dto);
    await this.wishlistRepo.remove(item);

    this.logger.log(
      `Moved wishlist item ${wishlistId} to cart for user ${user.id}`,
    );
    return { success: true };
  }
  /**
   * Generate a public share token for a wishlist item (for sharing).
   * Only allowed for the owner.
   */
  async generateShareToken(user: User, wishlistId: number): Promise<string> {
    const item = await this.wishlistRepo.findOne({
      where: { id: wishlistId, user: { id: user.id } },
    });
    if (!item) throw new NotFoundException('Wishlist item not found');
    const token = randomUUID();
    item['shareToken'] = token; // Add a column in migration/entity
    await this.wishlistRepo.save(item);
    this.logger.log(`Share token generated for wishlist ${wishlistId}`);
    return token;
  }

  /**
   * Fetch a wishlist item by its public share token (for public view).
   */
  async getWishlistByShareToken(shareToken: string): Promise<Wishlist> {
    const item = await this.wishlistRepo.findOne({
      where: { shareToken },
      relations: ['product', 'productVariant'],
    });
    if (!item) throw new NotFoundException('Shared wishlist not found');
    return item;
  }

  /**
   * Admin analytics endpoint: number of wishlists, top wishlisted products, active users.
   * Only for admin dashboards.
   */
  async getWishlistAnalytics() {
    // Total count of wishlists (excluding softly deleted)
    const total = await this.wishlistRepo.count({
      where: { deletedAt: null },
    });

    // Top 10 most wishlisted products (MySQL/Postgres compatible)
    const topProducts = await this.wishlistRepo.query(
      `SELECT productId, COUNT(*) AS count FROM wishlists
    WHERE deletedAt IS NULL
    GROUP BY productId
    ORDER BY count DESC
    LIMIT 10`,
    );

    // Count of unique users with at least one wishlist item
    const users = await this.wishlistRepo
      .createQueryBuilder('w')
      .select('COUNT(DISTINCT w.userId)', 'activeUsers')
      .where('w.deletedAt IS NULL')
      .getRawOne();

    return {
      totalWishlists: total,
      topProducts, // Array of top wishlisted products and their counts
      activeUsers: users.activeUsers,
    };
  }
}
