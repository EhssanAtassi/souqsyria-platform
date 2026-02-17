import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
  Renderer2,
  OnDestroy,
  effect,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * JSON-LD Component
 *
 * @description
 * Injects JSON-LD structured data into the document head for SEO.
 * Supports Schema.org schemas including Product, Organization, BreadcrumbList, etc.
 * Automatically cleans up injected script on component destroy.
 *
 * Features:
 * - Dynamic JSON-LD injection
 * - Schema.org Product schema support
 * - Automatic cleanup on destroy
 * - Type-safe data input
 * - Reactive updates via signals
 *
 * @example
 * ```typescript
 * // In component template
 * <app-json-ld [data]="productJsonLd()" />
 *
 * // In component class
 * productJsonLd = computed(() => {
 *   const product = this.product();
 *   if (!product) return null;
 *   return {
 *     '@context': 'https://schema.org',
 *     '@type': 'Product',
 *     name: product.name,
 *     image: product.image,
 *     description: product.description,
 *     sku: product.sku,
 *     offers: {
 *       '@type': 'Offer',
 *       price: product.price,
 *       priceCurrency: 'USD',
 *       availability: 'https://schema.org/InStock'
 *     }
 *   };
 * });
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     JsonLdComponent:
 *       type: object
 *       description: Component for injecting JSON-LD structured data
 *       properties:
 *         data:
 *           type: object
 *           description: JSON-LD data object (Schema.org format)
 *           required: true
 */
@Component({
  selector: 'app-json-ld',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonLdComponent implements OnDestroy {
  /**
   * JSON-LD data input
   * @description Schema.org structured data object
   */
  data = input<Record<string, any> | null>(null);

  /**
   * Renderer for safe DOM manipulation
   * @private
   */
  private renderer = inject(Renderer2);

  /**
   * Document reference for head manipulation
   * @private
   */
  private document = inject(DOCUMENT);

  /**
   * Reference to injected script element for cleanup
   * @private
   */
  private scriptElement: HTMLScriptElement | null = null;

  constructor() {
    // Watch for data changes and update script
    effect(() => {
      const jsonData = this.data();
      if (jsonData) {
        this.injectJsonLd(jsonData);
      } else {
        this.removeJsonLd();
      }
    });
  }

  /**
   * @description Cleans up injected script on component destroy
   */
  ngOnDestroy(): void {
    this.removeJsonLd();
  }

  /**
   * Inject JSON-LD script into document head
   * @description Creates a <script type="application/ld+json"> element with structured data
   * @param data - JSON-LD data object
   * @private
   */
  private injectJsonLd(data: Record<string, any>): void {
    // Remove existing script if present
    this.removeJsonLd();

    // Create script element
    this.scriptElement = this.renderer.createElement('script');
    this.renderer.setAttribute(this.scriptElement, 'type', 'application/ld+json');

    // Set JSON content
    const jsonText = JSON.stringify(data, null, 0); // Minified JSON
    const textNode = this.renderer.createText(jsonText);
    this.renderer.appendChild(this.scriptElement, textNode);

    // Append to document head
    this.renderer.appendChild(this.document.head, this.scriptElement);
  }

  /**
   * Remove JSON-LD script from document head
   * @description Cleans up the injected script element
   * @private
   */
  private removeJsonLd(): void {
    if (this.scriptElement) {
      this.renderer.removeChild(this.document.head, this.scriptElement);
      this.scriptElement = null;
    }
  }
}
