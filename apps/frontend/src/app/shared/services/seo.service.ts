import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

/**
 * SEO Service
 *
 * @description
 * Comprehensive SEO service for SouqSyria marketplace.
 * Manages meta tags, Open Graph, Twitter Cards, and structured data
 * for optimal search engine visibility and social sharing.
 *
 * Features:
 * - Dynamic page titles and meta descriptions
 * - Open Graph tags for Facebook/LinkedIn
 * - Twitter Card tags for Twitter/X
 * - Product-specific meta tags (price, currency, availability)
 * - Bilingual meta content (English/Arabic)
 * - Canonical URL management
 * - Locale-specific tags (en_US, ar_SA)
 *
 * @example
 * ```typescript
 * // Inject the service
 * private seoService = inject(SeoService);
 *
 * // Set product meta tags
 * this.seoService.setProductMeta(product, 'en');
 *
 * // Set product list meta tags
 * this.seoService.setProductListMeta({
 *   categoryName: 'Handcrafted Textiles',
 *   page: 1,
 *   language: 'en'
 * });
 *
 * // Clear meta tags on navigation
 * this.seoService.clearMeta();
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     SeoService:
 *       type: object
 *       description: Service for managing SEO meta tags and social sharing
 *       methods:
 *         setProductMeta:
 *           description: Set meta tags for product detail page
 *           parameters:
 *             - name: product
 *               type: object
 *               required: true
 *             - name: language
 *               type: string
 *               required: true
 *         setProductListMeta:
 *           description: Set meta tags for product list page
 *           parameters:
 *             - name: options
 *               type: object
 *               required: true
 *         clearMeta:
 *           description: Remove all custom meta tags
 */
@Injectable({
  providedIn: 'root'
})
export class SeoService {
  /**
   * Meta tag service for managing <meta> tags
   * @private
   */
  private meta = inject(Meta);

  /**
   * Title service for managing <title> tag
   * @private
   */
  private titleService = inject(Title);

  /**
   * Document reference for DOM operations
   * @private
   */
  private document = inject(DOCUMENT);

  /**
   * Router for generating canonical URLs
   * @private
   */
  private router = inject(Router);

  /**
   * Base URL for absolute URLs in meta tags
   * @private
   */
  private readonly baseUrl = 'https://souqsyria.com';

  /**
   * Set product meta tags
   * @description Sets page title, meta description, Open Graph, Twitter Card, and product-specific tags
   * @param product - Product data
   * @param language - Current UI language ('en' or 'ar')
   *
   * @example
   * ```typescript
   * this.seoService.setProductMeta({
   *   nameEn: 'Damascus Steel Chef Knife',
   *   nameAr: 'سكين الطاهي من الفولاذ الدمشقي',
   *   slug: 'damascus-steel-chef-knife',
   *   descriptions: [{
   *     language: 'en',
   *     shortDescription: 'Authentic handforged Damascus steel knife',
   *     content: '...'
   *   }],
   *   images: [{ imageUrl: 'https://...' }],
   *   pricing: { basePrice: 250, discountPrice: 200, currency: 'USD' },
   *   stockStatus: 'in_stock',
   *   sku: 'DMK-001'
   * }, 'en');
   * ```
   */
  setProductMeta(product: any, language: 'en' | 'ar'): void {
    const productName = language === 'ar' ? product.nameAr : product.nameEn;
    const description = product.descriptions?.find((d: any) => d.language === language);
    const shortDescription = description?.shortDescription || description?.content || '';
    const imageUrl = product.images?.[0]?.imageUrl || '';
    const productUrl = `${this.baseUrl}/products/${product.slug}`;
    const price = product.pricing?.discountPrice || product.pricing?.basePrice;
    const currency = product.pricing?.currency || 'USD';
    const locale = language === 'ar' ? 'ar_SA' : 'en_US';

    // Page title
    this.titleService.setTitle(`${productName} - SouqSyria`);

    // Meta description
    this.meta.updateTag({
      name: 'description',
      content: shortDescription.substring(0, 160)
    });

    // Open Graph tags
    this.meta.updateTag({ property: 'og:title', content: productName });
    this.meta.updateTag({ property: 'og:description', content: shortDescription.substring(0, 200) });
    this.meta.updateTag({ property: 'og:image', content: imageUrl });
    this.meta.updateTag({ property: 'og:type', content: 'product' });
    this.meta.updateTag({ property: 'og:url', content: productUrl });
    this.meta.updateTag({ property: 'og:locale', content: locale });
    this.meta.updateTag({ property: 'og:site_name', content: 'SouqSyria' });

    // Product-specific Open Graph tags
    if (price) {
      this.meta.updateTag({ property: 'product:price:amount', content: String(price) });
      this.meta.updateTag({ property: 'product:price:currency', content: currency });
    }

    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: productName });
    this.meta.updateTag({ name: 'twitter:description', content: shortDescription.substring(0, 200) });
    this.meta.updateTag({ name: 'twitter:image', content: imageUrl });

    // Canonical URL
    this.setCanonicalUrl(productUrl);
  }

  /**
   * Set product list meta tags
   * @description Sets meta tags for product listing pages with category/search context
   * @param options - Configuration options
   * @param options.categoryName - Category name for filtered lists
   * @param options.searchQuery - Search term for search results
   * @param options.page - Current page number
   * @param options.language - Current UI language
   *
   * @example
   * ```typescript
   * this.seoService.setProductListMeta({
   *   categoryName: 'Handcrafted Textiles',
   *   page: 2,
   *   language: 'en'
   * });
   *
   * this.seoService.setProductListMeta({
   *   searchQuery: 'damascus steel',
   *   page: 1,
   *   language: 'en'
   * });
   * ```
   */
  setProductListMeta(options: {
    categoryName?: string;
    searchQuery?: string;
    page: number;
    language: 'en' | 'ar';
  }): void {
    const { categoryName, searchQuery, page, language } = options;
    const locale = language === 'ar' ? 'ar_SA' : 'en_US';

    let title = 'Products';
    let description = 'Browse authentic Syrian products handcrafted with traditional techniques';

    if (categoryName) {
      title = language === 'ar'
        ? `${categoryName} - المنتجات`
        : `${categoryName} - Products`;
      description = language === 'ar'
        ? `تصفح منتجات ${categoryName} السورية الأصيلة المصنوعة يدوياً`
        : `Browse authentic Syrian ${categoryName} handcrafted with traditional techniques`;
    } else if (searchQuery) {
      title = language === 'ar'
        ? `نتائج البحث: ${searchQuery}`
        : `Search Results: ${searchQuery}`;
      description = language === 'ar'
        ? `نتائج البحث عن "${searchQuery}" في سوق سوريا`
        : `Search results for "${searchQuery}" on SouqSyria marketplace`;
    }

    if (page > 1) {
      title += language === 'ar' ? ` - صفحة ${page}` : ` - Page ${page}`;
    }

    title += ' - SouqSyria';

    // Page title
    this.titleService.setTitle(title);

    // Meta description
    this.meta.updateTag({ name: 'description', content: description });

    // Open Graph tags
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:locale', content: locale });
    this.meta.updateTag({ property: 'og:site_name', content: 'SouqSyria' });

    // Twitter Card tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    // Canonical URL
    const canonicalUrl = `${this.baseUrl}${this.router.url.split('?')[0]}`;
    this.setCanonicalUrl(canonicalUrl);
  }

  /**
   * Clear all custom meta tags
   * @description Removes all custom meta tags set by this service
   * Call this on component destroy or route change to clean up
   *
   * @example
   * ```typescript
   * ngOnDestroy() {
   *   this.seoService.clearMeta();
   * }
   * ```
   */
  clearMeta(): void {
    // Remove Open Graph tags
    this.meta.removeTag('property="og:title"');
    this.meta.removeTag('property="og:description"');
    this.meta.removeTag('property="og:image"');
    this.meta.removeTag('property="og:type"');
    this.meta.removeTag('property="og:url"');
    this.meta.removeTag('property="og:locale"');
    this.meta.removeTag('property="og:site_name"');
    this.meta.removeTag('property="product:price:amount"');
    this.meta.removeTag('property="product:price:currency"');

    // Remove Twitter Card tags
    this.meta.removeTag('name="twitter:card"');
    this.meta.removeTag('name="twitter:title"');
    this.meta.removeTag('name="twitter:description"');
    this.meta.removeTag('name="twitter:image"');

    // Remove canonical link
    this.removeCanonicalUrl();
  }

  /**
   * Set canonical URL
   * @description Creates or updates the canonical link tag in document head
   * @param url - Canonical URL
   * @private
   */
  private setCanonicalUrl(url: string): void {
    this.removeCanonicalUrl();

    const link = this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    this.document.head.appendChild(link);
  }

  /**
   * Remove canonical URL
   * @description Removes the canonical link tag from document head
   * @private
   */
  private removeCanonicalUrl(): void {
    const existingLink = this.document.querySelector('link[rel="canonical"]');
    if (existingLink) {
      existingLink.remove();
    }
  }
}
