import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ProductsQuery } from '../../../store/products/products.query';
import { CartService } from '../../../store/cart/cart.service';
import { Product } from '../../../shared/interfaces/product.interface';
import { WishlistAkitaService } from '../../../store/wishlist/wishlist-akita.service';
import { ShareService } from '../../../shared/services/share.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/ui/breadcrumb/breadcrumb.component';
import { LoaderComponent } from '../../../shared/components/ui/loader/loader.component';
import { AlertComponent } from '../../../shared/components/ui/alert/alert.component';
import { BadgeComponent } from '../../../shared/components/ui/badge/badge.component';
import { ProductBoxGridComponent } from '../../../shared/components/ui/product-box/product-box-grid.component';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';

/**
 * Product Detail Component - Syrian Marketplace
 *
 * Feature component displaying comprehensive product information with:
 * - Image gallery with zoom functionality
 * - Product specifications and heritage story
 * - Reviews and ratings
 * - Related products recommendations
 * - Add to cart with quantity selection
 * - Bilingual support (English/Arabic) with RTL layout
 *
 * @swagger
 * components:
 *   schemas:
 *     ProductDetailComponent:
 *       type: object
 *       description: Product detail page component
 *       properties:
 *         productSlug:
 *           type: string
 *           description: URL-friendly product identifier
 *         selectedImageIndex:
 *           type: number
 *           description: Currently displayed image in gallery
 *         quantity:
 *           type: number
 *           description: Selected quantity for purchase
 *         activeTab:
 *           type: number
 *           description: Active tab index (0=Description, 1=Reviews, 2=Shipping)
 *
 * @example
 * // Usage in route:
 * Route: /product/damascus-steel-chef-knife
 * Component auto-loads product from slug
 */
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatTabsModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    BreadcrumbComponent,
    LoaderComponent,
    AlertComponent,
    BadgeComponent,
    ProductBoxGridComponent,
    ButtonComponent
  ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent implements OnInit {
  /**
   * Injected services
   */
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsQuery = inject(ProductsQuery);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistAkitaService);
  private shareService = inject(ShareService);
  private snackBar = inject(MatSnackBar);

  /**
   * Reactive state signals
   */
  productSlug = signal<string>('');
  selectedImageIndex = signal(0);
  quantity = signal(1);
  language = signal<'en' | 'ar'>('en');
  isAddingToCart = signal(false);
  showSuccessAlert = signal(false);
  isInWishlist = signal(false);

  /**
   * Product data from Akita store
   */
  product = computed<Product | undefined>(() => {
    const slug = this.productSlug();
    if (!slug) return undefined;

    const allProducts = this.productsQuery.getAll();
    return allProducts.find(p => p.slug === slug);
  });

  /**
   * Related products (same category)
   */
  relatedProducts = computed<Product[]>(() => {
    const currentProduct = this.product();
    if (!currentProduct) return [];

    const allProducts = this.productsQuery.getAll();
    return allProducts
      .filter(p =>
        p.category.slug === currentProduct.category.slug &&
        p.id !== currentProduct.id
      )
      .slice(0, 4); // Limit to 4 related products
  });

  /**
   * Breadcrumb navigation
   */
  breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const currentProduct = this.product();
    const items: BreadcrumbItem[] = [
      {
        label: 'Home',
        labelArabic: 'الرئيسية',
        url: '/',
        icon: 'home'
      },
      {
        label: 'Products',
        labelArabic: 'المنتجات',
        url: '/products'
      }
    ];

    if (currentProduct) {
      items.push(
        {
          label: currentProduct.category.name,
          labelArabic: currentProduct.category.nameArabic,
          url: `/products/${currentProduct.category.slug}`
        },
        {
          label: currentProduct.name,
          labelArabic: currentProduct.nameArabic
        }
      );
    }

    return items;
  });

  /**
   * Selected image URL
   */
  selectedImage = computed<string>(() => {
    const currentProduct = this.product();
    if (!currentProduct) return '';

    const index = this.selectedImageIndex();
    return currentProduct.images[index]?.url || currentProduct.images[0]?.url || '';
  });

  /**
   * Product availability check
   */
  isAvailable = computed<boolean>(() => {
    const currentProduct = this.product();
    return currentProduct?.inventory.inStock && currentProduct.inventory.quantity > 0 || false;
  });

  /**
   * Price calculations
   */
  totalPrice = computed<number>(() => {
    const currentProduct = this.product();
    if (!currentProduct) return 0;
    return currentProduct.price.amount * this.quantity();
  });

  /**
   * Discount percentage
   */
  discountPercentage = computed<number | null>(() => {
    const currentProduct = this.product();
    return currentProduct?.price.discount?.percentage || null;
  });

  constructor() {
    // Listen to route params
    this.route.params
      .pipe(takeUntilDestroyed())
      .subscribe(params => {
        const slug = params['slug'];
        if (slug) {
          this.productSlug.set(slug);
          this.resetComponent();
        }
      });

    // Load language preference
    const savedLanguage = localStorage.getItem('language') as 'en' | 'ar';
    if (savedLanguage) {
      this.language.set(savedLanguage);
    }
  }

  /**
   * Component initialization
   */
  ngOnInit(): void {
    // Products should already be loaded from product-list
    // If not found, navigate to 404 or products page
    setTimeout(() => {
      if (!this.product()) {
        console.error('Product not found:', this.productSlug());
        this.router.navigate(['/products']);
      } else {
        // Check if product is in wishlist
        this.isInWishlist.set(this.wishlistService.isInWishlist(this.product()!.id));
      }
    }, 100);
  }

  /**
   * Reset component state when product changes
   */
  private resetComponent(): void {
    this.selectedImageIndex.set(0);
    this.quantity.set(1);
    this.showSuccessAlert.set(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Select image from gallery
   *
   * @param index - Image index to display
   */
  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  /**
   * Navigate to next image
   */
  nextImage(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;

    const maxIndex = currentProduct.images.length - 1;
    const currentIndex = this.selectedImageIndex();
    this.selectedImageIndex.set(currentIndex < maxIndex ? currentIndex + 1 : 0);
  }

  /**
   * Navigate to previous image
   */
  previousImage(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;

    const maxIndex = currentProduct.images.length - 1;
    const currentIndex = this.selectedImageIndex();
    this.selectedImageIndex.set(currentIndex > 0 ? currentIndex - 1 : maxIndex);
  }

  /**
   * Increase quantity
   */
  increaseQuantity(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;

    const maxQuantity = currentProduct.inventory.quantity;
    if (this.quantity() < maxQuantity) {
      this.quantity.update(q => q + 1);
    }
  }

  /**
   * Decrease quantity
   */
  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  /**
   * Add product to cart
   */
  addToCart(): void {
    const currentProduct = this.product();
    if (!currentProduct || !this.isAvailable()) return;

    this.isAddingToCart.set(true);

    // Simulate API delay
    setTimeout(() => {
      this.cartService.addToCart(currentProduct.id, this.quantity());
      this.isAddingToCart.set(false);
      this.showSuccessAlert.set(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        this.showSuccessAlert.set(false);
      }, 3000);
    }, 300);
  }

  /**
   * Toggle wishlist
   * @description Add or remove product from wishlist
   */
  toggleWishlist(): void {
    const currentProduct = this.product();
    if (!currentProduct) return;

    const wasAdded = this.wishlistService.toggleWishlist(currentProduct);
    this.isInWishlist.set(this.wishlistService.isInWishlist(currentProduct.id));

    const message = wasAdded
      ? (this.language() === 'ar'
          ? `تمت إضافة ${currentProduct.nameArabic || currentProduct.name} إلى قائمة الأمنيات`
          : `${currentProduct.name} added to wishlist`)
      : (this.language() === 'ar'
          ? `تم إزالة ${currentProduct.nameArabic || currentProduct.name} من قائمة الأمنيات`
          : `${currentProduct.name} removed from wishlist`);

    this.showNotification(message, 'success');
  }

  /**
   * Share product using native share or fallback
   * @description Opens native share dialog or copies link to clipboard
   */
  async shareProduct(): Promise<void> {
    const currentProduct = this.product();
    if (!currentProduct) return;

    const productUrl = `${window.location.origin}/product/${currentProduct.slug}`;
    const productName = this.getProductName();
    const productImage = currentProduct.images[0]?.url;

    const shareResult = await this.shareService.shareProduct(
      productName,
      productUrl,
      productImage
    );

    if (shareResult.success) {
      const message = shareResult.method === 'clipboard'
        ? (this.language() === 'ar' ? 'تم نسخ الرابط' : 'Link copied to clipboard!')
        : (this.language() === 'ar' ? 'تمت المشاركة بنجاح' : 'Shared successfully!');
      this.showNotification(message, 'success');
    }
  }

  /**
   * Share on specific platform
   * @description Shares product on specified social media platform
   * @param platform - Platform name ('facebook', 'twitter', 'whatsapp')
   */
  shareOnPlatform(platform: 'facebook' | 'twitter' | 'whatsapp'): void {
    const currentProduct = this.product();
    if (!currentProduct) return;

    const productUrl = `${window.location.origin}/product/${currentProduct.slug}`;
    const productName = this.getProductName();
    const shareText = `${productName} - ${currentProduct.price.currency} ${currentProduct.price.amount}`;

    switch (platform) {
      case 'facebook':
        this.shareService.shareOnFacebook(productUrl, shareText);
        break;
      case 'twitter':
        this.shareService.shareOnTwitter(productUrl, shareText, ['SyrianProducts', 'Handmade']);
        break;
      case 'whatsapp':
        this.shareService.shareOnWhatsApp(productUrl, shareText);
        break;
    }

    this.showNotification(
      this.language() === 'ar' ? 'جاري فتح منصة المشاركة...' : 'Opening share platform...',
      'info'
    );
  }

  /**
   * Get star rating array for display
   *
   * @param rating - Average rating value
   * @returns Array of 5 boolean values for star display
   */
  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < Math.round(rating));
  }

  /**
   * Format price with currency
   *
   * @param amount - Price amount
   * @returns Formatted price string
   */
  formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get product name based on language
   */
  getProductName(): string {
    const currentProduct = this.product();
    if (!currentProduct) return '';

    return this.language() === 'ar' && currentProduct.nameArabic
      ? currentProduct.nameArabic
      : currentProduct.name;
  }

  /**
   * Get product description based on language
   */
  getProductDescription(): string {
    const currentProduct = this.product();
    if (!currentProduct) return '';

    return this.language() === 'ar' && currentProduct.descriptionArabic
      ? currentProduct.descriptionArabic
      : currentProduct.description;
  }

  /**
   * Show notification to user
   * @description Displays Material snackbar notification
   * @param message - Message to display
   * @param type - Notification type
   */
  private showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    let panelClass = '';
    switch (type) {
      case 'success': panelClass = 'success-snackbar'; break;
      case 'error': panelClass = 'error-snackbar'; break;
      case 'info': panelClass = 'info-snackbar'; break;
      case 'warning': panelClass = 'warning-snackbar'; break;
    }

    this.snackBar.open(message, this.language() === 'ar' ? 'إغلاق' : 'Close', {
      duration: 3000,
      panelClass: panelClass,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
