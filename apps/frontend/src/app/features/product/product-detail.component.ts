import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

import { Product } from '../../shared/interfaces/product.interface';
import { ProductsService } from '../../store/products/products.service';
import { ProductsQuery } from '../../store/products/products.query';
import { CartService } from '../../store/cart/cart.service';
import { ProductRecommendationsComponent } from '../../shared/components/product-recommendations';
import { ProductRecommendationsCarouselComponent } from '../../shared/components/product-recommendations-carousel';

/**
 * Syrian marketplace product detail page component
 * Features comprehensive product information, image gallery, pricing, and B2C shopping experience
 * 
 * @swagger
 * components:
 *   schemas:
 *     ProductDetailComponent:
 *       type: object
 *       properties:
 *         product:
 *           $ref: '#/components/schemas/Product'
 *         selectedImage:
 *           type: object
 *           description: Currently selected product image
 *         quantity:
 *           type: number
 *           description: Selected quantity for purchase
 *         isLoading:
 *           type: boolean
 *           description: Loading state indicator
 *         selectedShippingMethod:
 *           type: string
 *           description: Selected shipping method ID
 */
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatTabsModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatBadgeModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    ProductRecommendationsComponent,
    ProductRecommendationsCarouselComponent
  ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent implements OnInit {
  
  /** Product data signal */
  product = signal<Product | null>(null);
  
  /** Loading state signal */
  isLoading = signal<boolean>(true);
  
  /** Error state signal */
  error = signal<string | null>(null);
  
  /** Selected image for gallery */
  selectedImage = signal<any>(null);
  
  /** Selected quantity for purchase */
  selectedQuantity = signal<number>(1);
  
  /** Selected shipping method */
  selectedShippingMethod = signal<string>('');
  
  /** Product slug from URL */
  private productSlug = signal<string>('');
  
  /** Computed total price including shipping */
  totalPrice = computed(() => {
    const prod = this.product();
    if (!prod) return 0;
    
    const productTotal = prod.price.amount * this.selectedQuantity();
    const shippingCost = this.getShippingCost();
    
    return productTotal + shippingCost;
  });
  
  /** Computed stock status */
  stockStatus = computed(() => {
    const prod = this.product();
    if (!prod) return 'unknown';
    
    if (!prod.inventory.inStock) return 'out_of_stock';
    if (prod.inventory.quantity <= prod.inventory.lowStockThreshold) return 'low_stock';
    return 'in_stock';
  });

  /** Image zoom state */
  isImageZoomed = signal<boolean>(false);
  
  /** Related products from same artisan */
  relatedProducts = signal<Product[]>([]);
  
  /** Products from same artisan */
  artisanProducts = signal<Product[]>([]);
  
  /** Recommended products based on cultural significance */
  recommendedProducts = signal<Product[]>([]);
  
  /** Current image zoom coordinates */
  zoomCoordinates = signal<{ x: number; y: number } | null>(null);
  
  /** Heritage story expansion state */
  isHeritageExpanded = signal<boolean>(false);
  
  /** Artisan profile expansion state */
  isArtisanExpanded = signal<boolean>(false);
  
  /** Available quantity options */
  quantityOptions = computed(() => {
    const prod = this.product();
    if (!prod) return [];
    
    const max = Math.min(
      prod.inventory.quantity,
      prod.inventory.maxOrderQuantity || prod.inventory.quantity
    );
    
    return Array.from(
      { length: max - prod.inventory.minOrderQuantity + 1 },
      (_, i) => prod.inventory.minOrderQuantity + i
    );
  });

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private productsService: ProductsService,
    private productsQuery: ProductsQuery,
    private cartService: CartService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Component initialization
   * Retrieves product slug from route and loads product data
   */
  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('productSlug');
    if (slug) {
      this.productSlug.set(slug);
      this.loadProduct(slug);
    } else {
      this.error.set('Product not found');
      this.isLoading.set(false);
    }
  }

  /**
   * Loads product data from service
   * 
   * @param slug - Product URL slug
   */
  private loadProduct(slug: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Load products using Akita
    this.productsService.loadProducts();

    // Get product by slug from query
    const product = this.productsQuery.getAll().find(p => p.slug === slug);

    if (product) {
      this.product.set(product);
      this.setupProductData(product);
      this.loadProductRecommendations(product);
      this.isLoading.set(false);
    } else {
      this.error.set('Product not found');
      this.isLoading.set(false);
    }
  }

  /**
   * Sets up product data after loading
   * 
   * @param product - Loaded product data
   */
  private setupProductData(product: Product): void {
    // Set primary image as selected
    const primaryImage = product.images.find(img => img.isPrimary);
    this.selectedImage.set(primaryImage || product.images[0]);
    
    // Set default shipping method
    if (product.shipping.methods.length > 0) {
      this.selectedShippingMethod.set(product.shipping.methods[0].id);
    }
  }

  /**
   * Loads product recommendations and related products
   * 
   * @param product - Current product
   */
  private loadProductRecommendations(product: Product): void {
    const allProducts = this.productsQuery.getAll();

    // Get related products from same category
    this.relatedProducts.set(
      allProducts
        .filter(p => p.category.slug === product.category.slug && p.id !== product.id)
        .slice(0, 4)
    );

    // Get products from same artisan
    this.artisanProducts.set(
      allProducts
        .filter(p => p.seller.id === product.seller.id && p.id !== product.id)
        .slice(0, 3)
    );

    // Get trending recommendations (highest rated products)
    this.recommendedProducts.set(
      allProducts
        .filter(p => p.id !== product.id)
        .sort((a, b) => b.reviews.averageRating - a.reviews.averageRating)
        .slice(0, 6)
    );
  }

  /**
   * Selects an image for the main gallery display
   * 
   * @param image - Image to display
   */
  selectImage(image: any): void {
    this.selectedImage.set(image);
    // Reset zoom when changing images
    this.isImageZoomed.set(false);
    this.zoomCoordinates.set(null);
  }

  /**
   * Toggles image zoom mode
   */
  toggleImageZoom(): void {
    this.isImageZoomed.set(!this.isImageZoomed());
    if (!this.isImageZoomed()) {
      this.zoomCoordinates.set(null);
    }
  }

  /**
   * Handles mouse movement for image zoom
   * 
   * @param event - Mouse event
   */
  onImageMouseMove(event: MouseEvent): void {
    if (!this.isImageZoomed()) return;
    
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    this.zoomCoordinates.set({ x: Math.min(Math.max(x, 0), 100), y: Math.min(Math.max(y, 0), 100) });
  }

  /**
   * Gets zoom transform style for image
   * 
   * @returns CSS transform string
   */
  getZoomTransform(): string {
    const coords = this.zoomCoordinates();
    if (!coords || !this.isImageZoomed()) return 'scale(1)';
    
    return `scale(2.5) translate(-${coords.x}%, -${coords.y}%)`;
  }

  /**
   * Toggles heritage story expansion
   */
  toggleHeritageStory(): void {
    this.isHeritageExpanded.set(!this.isHeritageExpanded());
  }

  /**
   * Toggles artisan profile expansion
   */
  toggleArtisanProfile(): void {
    this.isArtisanExpanded.set(!this.isArtisanExpanded());
  }

  /**
   * Handles product click for related products navigation
   * 
   * @param product - Product to navigate to
   */
  onProductClick(product: Product): void {
    // Navigate to new product and reload data
    this.router.navigate(['/product', product.slug]).then(() => {
      // Scroll to top after navigation
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /**
   * Toggles wishlist for related products
   * 
   * @param product - Product to add/remove from wishlist
   */
  onToggleWishlist(product: Product): void {
    console.log('Toggle wishlist:', product);
    // TODO: Implement wishlist service integration
  }

  /**
   * Quick add product to cart for recommended products
   *
   * @param productId - Product ID to add to cart
   */
  addProductToCart(productId: string): void {
    this.cartService.addToCart(productId, 1);
    this.showSnackBar('Product added to cart', 'success');
  }

  /**
   * Handles add to cart for recommended products (carousel component)
   *
   * @param product - Product object to add to cart
   */
  onRecommendedProductAddToCart(product: Product): void {
    this.cartService.addToCart(product.id, 1);
    this.showSnackBar(`Added ${product.name} to cart`, 'success');
  }

  /**
   * Handles product click for recommended products (carousel component)
   *
   * @param product - Product that was clicked
   */
  onRecommendedProductClick(product: Product): void {
    this.router.navigate(['/product', product.slug]).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /**
   * Gets the shipping cost for selected method
   * 
   * @returns Shipping cost amount
   */
  getShippingCost(): number {
    const prod = this.product();
    const methodId = this.selectedShippingMethod();
    
    if (!prod || !methodId) return 0;
    
    const method = prod.shipping.methods.find(m => m.id === methodId);
    return method ? method.cost.amount : 0;
  }

  /**
   * Gets stock status color for UI display
   * 
   * @returns CSS color class
   */
  getStockStatusColor(): string {
    const status = this.stockStatus();
    switch (status) {
      case 'in_stock': return 'text-green-600';
      case 'low_stock': return 'text-yellow-600'; 
      case 'out_of_stock': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  /**
   * Gets stock status text for display
   * 
   * @returns Human readable stock status
   */
  getStockStatusText(): string {
    const status = this.stockStatus();
    const prod = this.product();
    
    switch (status) {
      case 'in_stock': return `In Stock (${prod?.inventory.quantity} available)`;
      case 'low_stock': return `Low Stock (Only ${prod?.inventory.quantity} left)`;
      case 'out_of_stock': return 'Out of Stock';
      default: return 'Stock Unknown';
    }
  }

  /**
   * Adds product to shopping cart
   * Integrates with CartService for state management
   */
  addToCart(): void {
    const prod = this.product();
    const quantity = this.selectedQuantity();
    const shippingMethodId = this.selectedShippingMethod();
    
    if (!prod) return;
    
    if (!prod.inventory.inStock) {
      this.showSnackBar('Product is currently out of stock', 'error');
      return;
    }
    
    if (quantity > prod.inventory.quantity) {
      this.showSnackBar('Requested quantity not available', 'error');
      return;
    }
    
    // Add to cart using the cart service
    this.cartService.addToCart(prod.id, quantity);
    this.showSnackBar(`Added ${quantity} ${prod.name} to cart`, 'success');
  }

  /**
   * Proceeds to checkout with current selection
   * Adds to cart and navigates to checkout
   */
  buyNow(): void {
    const prod = this.product();
    const quantity = this.selectedQuantity();
    const shippingMethodId = this.selectedShippingMethod();
    
    if (!prod || !prod.inventory.inStock) return;
    
    // Add to cart first, then navigate to checkout
    this.cartService.addToCart(prod.id, quantity);

    // TODO: Navigate to checkout page
    // this.router.navigate(['/checkout']);
    console.log('Buy now - redirecting to checkout:', {
      productId: prod.id,
      quantity: quantity,
      totalPrice: this.totalPrice()
    });
    this.showSnackBar('Redirecting to checkout...', 'info');
  }

  /**
   * Adds product to wishlist
   * TODO: Implement wishlist service integration
   */
  addToWishlist(): void {
    const prod = this.product();
    if (!prod) return;
    
    // TODO: Integrate with actual wishlist service
    console.log('Adding to wishlist:', prod.id);
    this.showSnackBar('Added to wishlist', 'success');
  }

  /**
   * Shares product via Web Share API or fallback
   */
  shareProduct(): void {
    const prod = this.product();
    if (!prod) return;
    
    const shareData = {
      title: prod.name,
      text: prod.description,
      url: window.location.href
    };
    
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      this.showSnackBar('Product link copied to clipboard', 'success');
    }
  }

  /**
   * Shows snack bar notification
   * 
   * @param message - Message to display
   * @param type - Notification type
   */
  private showSnackBar(message: string, type: 'success' | 'error' | 'info'): void {
    let panelClass = '';
    switch (type) {
      case 'success': panelClass = 'success-snackbar'; break;
      case 'error': panelClass = 'error-snackbar'; break;
      case 'info': panelClass = 'info-snackbar'; break;
    }
    
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: panelClass
    });
  }

  /**
   * Formats price for display with currency
   * 
   * @param amount - Price amount
   * @param currency - Currency code
   * @returns Formatted price string
   */
  formatPrice(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Calculates and formats discount percentage
   * 
   * @param originalPrice - Original price
   * @param currentPrice - Discounted price
   * @returns Formatted discount percentage
   */
  getDiscountPercentage(originalPrice: number, currentPrice: number): string {
    const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    return Math.round(discount) + '% OFF';
  }

  /**
   * Gets rating count for a specific rating value
   * Helper method to handle TypeScript strict typing for rating distribution
   * 
   * @param rating - Rating value (1-5)
   * @returns Number of reviews for that rating
   */
  getRatingCount(rating: number): number {
    const prod = this.product();
    if (!prod) return 0;
    
    const distribution = prod.reviews.ratingDistribution;
    switch (rating) {
      case 1: return distribution[1];
      case 2: return distribution[2];
      case 3: return distribution[3];
      case 4: return distribution[4];
      case 5: return distribution[5];
      default: return 0;
    }
  }
}