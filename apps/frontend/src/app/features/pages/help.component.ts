import { Component, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

/**
 * FAQ Interface
 * @description Structure for FAQ items
 */
interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  relatedLinks?: { text: string; url: string }[];
}

/**
 * Category Interface
 * @description Structure for FAQ categories
 */
interface Category {
  id: string;
  name: string;
  icon: string;
}

/**
 * Help Page Component
 *
 * @description
 * Comprehensive help and support page for SouqSyria marketplace including:
 * - Searchable FAQ database
 * - Category filtering
 * - Syrian-specific information (shipping, COD payments, authenticity)
 * - Accordion-style FAQ display
 * - Contact support options
 * - WhatsApp integration
 *
 * Features:
 * - Real-time search filtering
 * - Category-based navigation
 * - Collapsible FAQ panels with MatExpansion
 * - Related links for each FAQ
 * - Bilingual content (English/Arabic)
 * - Golden Wheat design system styling
 *
 * @example
 * ```html
 * <app-help></app-help>
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     HelpComponent:
 *       type: object
 *       description: Syrian marketplace help page with searchable FAQ
 *       properties:
 *         categories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 */
@Component({
  selector: 'app-help',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './help.component.html',
  styleUrl: './help.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpComponent {
  /**
   * Search query for filtering FAQs
   */
  searchQuery = signal<string>('');

  /**
   * Selected category filter
   */
  selectedCategory = signal<string | null>(null);

  /**
   * FAQ Categories
   * @description All available FAQ categories with icons
   */
  categories: Category[] = [
    { id: 'all', name: 'All Topics', icon: 'apps' },
    { id: 'shipping', name: 'Shipping & Delivery', icon: 'local_shipping' },
    { id: 'payment', name: 'Payment Methods', icon: 'payment' },
    { id: 'authenticity', name: 'Authenticity', icon: 'verified' },
    { id: 'returns', name: 'Returns & Refunds', icon: 'cached' },
    { id: 'account', name: 'Account & Orders', icon: 'person' },
    { id: 'products', name: 'Products & Care', icon: 'shopping_bag' }
  ];

  /**
   * All FAQs database
   * @description Comprehensive FAQ database with Syrian-specific information
   */
  private allFaqs: FAQ[] = [
    // SHIPPING & DELIVERY
    {
      id: 'ship-1',
      category: 'shipping',
      question: 'What are the delivery times for different Syrian governorates?',
      answer: `
        <p>Delivery times vary by governorate:</p>
        <ul>
          <li><strong>Damascus & Rif Dimashq:</strong> 1-2 business days</li>
          <li><strong>Aleppo, Homs, Latakia, Tartus, Hama:</strong> 2-4 business days</li>
          <li><strong>Idlib, Daraa, As-Suwayda, Quneitra:</strong> 3-5 business days</li>
          <li><strong>Deir ez-Zor, Al-Hasakah, Raqqa:</strong> 5-7 business days</li>
        </ul>
        <p>All orders are processed within 24 hours of placement.</p>
      `,
      keywords: ['delivery', 'time', 'governorate', 'damascus', 'aleppo', 'shipping'],
      relatedLinks: [{ text: 'View Shipping Rates', url: '/help' }]
    },
    {
      id: 'ship-2',
      category: 'shipping',
      question: 'Do you offer international shipping?',
      answer: `
        <p>Yes! We ship authentic Syrian products worldwide. International shipping options:</p>
        <ul>
          <li><strong>Standard Shipping:</strong> 10-15 business days</li>
          <li><strong>Express Shipping:</strong> 5-7 business days</li>
        </ul>
        <p>Customs fees and import duties are the responsibility of the buyer. All packages are fully insured and tracked.</p>
      `,
      keywords: ['international', 'worldwide', 'export', 'customs', 'shipping'],
      relatedLinks: [{ text: 'International Rates', url: '/help' }]
    },
    {
      id: 'ship-3',
      category: 'shipping',
      question: 'How can I track my order?',
      answer: `
        <p>Once your order is shipped, you'll receive:</p>
        <ol>
          <li>Email confirmation with tracking number</li>
          <li>SMS notification to your registered phone number</li>
          <li>Real-time tracking in your account dashboard</li>
        </ol>
        <p>You can track your order anytime by logging into your account and visiting the "Order History" section.</p>
      `,
      keywords: ['track', 'tracking', 'order status', 'where is my order'],
      relatedLinks: [{ text: 'Order History', url: '/account/orders' }]
    },

    // PAYMENT METHODS
    {
      id: 'pay-1',
      category: 'payment',
      question: 'What payment methods do you accept?',
      answer: `
        <p>We offer multiple secure payment options:</p>
        <ul>
          <li><strong>Cash on Delivery (COD):</strong> Pay when you receive your order (available for all Syrian governorates)</li>
          <li><strong>Credit/Debit Cards:</strong> Visa, Mastercard via Stripe (secure payment gateway)</li>
          <li><strong>Bank Transfer:</strong> Direct transfer to our Syrian bank account</li>
        </ul>
        <p>All online payments are encrypted and secure. We never store your card information.</p>
      `,
      keywords: ['payment', 'cod', 'cash on delivery', 'credit card', 'visa', 'mastercard', 'stripe'],
      relatedLinks: []
    },
    {
      id: 'pay-2',
      category: 'payment',
      question: 'Is Cash on Delivery (COD) available in my area?',
      answer: `
        <p>Yes! Cash on Delivery is available in all 14 Syrian governorates:</p>
        <p>Damascus, Aleppo, Homs, Latakia, Hama, Tartus, Idlib, Daraa, Deir ez-Zor, Al-Hasakah, Raqqa, As-Suwayda, Quneitra, and Rif Dimashq.</p>
        <p><strong>How it works:</strong></p>
        <ol>
          <li>Place your order and select "Cash on Delivery"</li>
          <li>Our courier will contact you before delivery</li>
          <li>Inspect your products upon arrival</li>
          <li>Pay the exact amount in Syrian Pounds (SYP), USD, or EUR</li>
        </ol>
        <p>No additional COD fees are charged!</p>
      `,
      keywords: ['cod', 'cash on delivery', 'governorate', 'available', 'payment on delivery'],
      relatedLinks: []
    },
    {
      id: 'pay-3',
      category: 'payment',
      question: 'What currencies do you accept?',
      answer: `
        <p>We accept three currencies for your convenience:</p>
        <ul>
          <li><strong>Syrian Pound (SYP):</strong> Primary currency for domestic orders</li>
          <li><strong>US Dollar (USD):</strong> Accepted for all orders</li>
          <li><strong>Euro (EUR):</strong> Accepted for all orders</li>
        </ul>
        <p>Exchange rates are updated daily based on the official Central Bank of Syria rates. Prices are displayed in your selected currency throughout the checkout process.</p>
      `,
      keywords: ['currency', 'usd', 'eur', 'syp', 'dollar', 'euro', 'pound'],
      relatedLinks: []
    },

    // AUTHENTICITY & VERIFICATION
    {
      id: 'auth-1',
      category: 'authenticity',
      question: 'How do you verify the authenticity of Syrian products?',
      answer: `
        <p>Every product undergoes our rigorous 4-step authentication process:</p>
        <ol>
          <li><strong>Artisan Verification:</strong> Direct partnership with certified Syrian artisans</li>
          <li><strong>Traditional Method Inspection:</strong> Verification of authentic production techniques</li>
          <li><strong>Material Authenticity:</strong> Testing of raw materials (Damascus steel composition, laurel oil percentage, etc.)</li>
          <li><strong>Heritage Certification:</strong> UNESCO World Heritage compliance where applicable</li>
        </ol>
        <p>Each product comes with a Certificate of Authenticity detailing its origin, artisan, and traditional method.</p>
      `,
      keywords: ['authenticity', 'verification', 'genuine', 'real', 'fake', 'unesco'],
      relatedLinks: [{ text: 'About Our Artisans', url: '/about' }]
    },
    {
      id: 'auth-2',
      category: 'authenticity',
      question: 'What is the UNESCO Heritage certification?',
      answer: `
        <p>UNESCO has recognized several Syrian crafts as Intangible Cultural Heritage:</p>
        <ul>
          <li><strong>Damascus Steel Forging:</strong> Ancient technique dating back to 300 BC</li>
          <li><strong>Aleppo Soap Making:</strong> Traditional cold-process method with laurel oil</li>
          <li><strong>Syrian Brocade Weaving:</strong> Intricate patterns woven on traditional looms</li>
        </ul>
        <p>Products with UNESCO certification have been verified to use authentic traditional methods and support the preservation of Syrian cultural heritage.</p>
      `,
      keywords: ['unesco', 'heritage', 'certification', 'damascus steel', 'aleppo soap', 'brocade'],
      relatedLinks: []
    },
    {
      id: 'auth-3',
      category: 'authenticity',
      question: 'Can I visit the artisans or workshops?',
      answer: `
        <p>Yes! We encourage customers to connect with our artisans:</p>
        <ul>
          <li><strong>Virtual Tours:</strong> Live video calls with artisans to see their workshops</li>
          <li><strong>In-Person Visits:</strong> Schedule visits to Damascus and Aleppo workshops (advance booking required)</li>
          <li><strong>Artisan Stories:</strong> Each product page includes the artisan's profile and workshop history</li>
        </ul>
        <p>Contact our support team to arrange an artisan visit or virtual tour.</p>
      `,
      keywords: ['visit', 'artisan', 'workshop', 'tour', 'damascus', 'aleppo'],
      relatedLinks: [{ text: 'Contact Us', url: '/contact' }]
    },

    // RETURNS & REFUNDS
    {
      id: 'return-1',
      category: 'returns',
      question: 'What is your return policy?',
      answer: `
        <p>We offer a <strong>14-day return policy</strong> for all products:</p>
        <ul>
          <li>Products must be unused and in original packaging</li>
          <li>Certificate of Authenticity must be included</li>
          <li>Return shipping costs are covered by SouqSyria</li>
        </ul>
        <p><strong>Non-returnable items:</strong> Food products (spices, nuts, sweets), custom-made items, and products marked "Final Sale"</p>
        <p>To initiate a return, contact support or visit your Order History page.</p>
      `,
      keywords: ['return', 'refund', 'exchange', 'policy', 'money back'],
      relatedLinks: [{ text: 'Start a Return', url: '/account/orders' }]
    },
    {
      id: 'return-2',
      category: 'returns',
      question: 'How long does it take to process a refund?',
      answer: `
        <p>Refund processing timeline:</p>
        <ol>
          <li><strong>Product received:</strong> 1-2 business days for inspection</li>
          <li><strong>Refund approved:</strong> Immediate notification via email</li>
          <li><strong>Payment method refund:</strong>
            <ul>
              <li>COD orders: Bank transfer within 3-5 business days</li>
              <li>Card payments: 5-10 business days to appear on statement</li>
            </ul>
          </li>
        </ol>
        <p>You'll receive email updates at every step of the refund process.</p>
      `,
      keywords: ['refund', 'how long', 'processing time', 'timeline'],
      relatedLinks: []
    },

    // ACCOUNT & ORDERS
    {
      id: 'account-1',
      category: 'account',
      question: 'How do I create an account?',
      answer: `
        <p>Creating a SouqSyria account is quick and free:</p>
        <ol>
          <li>Click "Register" in the top navigation</li>
          <li>Enter your name, email, phone number, and Syrian governorate</li>
          <li>Create a secure password</li>
          <li>Verify your email address</li>
        </ol>
        <p><strong>Benefits of having an account:</strong></p>
        <ul>
          <li>Faster checkout process</li>
          <li>Order history and tracking</li>
          <li>Wishlist for favorite products</li>
          <li>Exclusive promotions and early access to new products</li>
        </ul>
      `,
      keywords: ['account', 'register', 'sign up', 'create account'],
      relatedLinks: [{ text: 'Create Account', url: '/register' }]
    },
    {
      id: 'account-2',
      category: 'account',
      question: 'Can I change or cancel my order?',
      answer: `
        <p><strong>Before shipment:</strong> Yes, orders can be modified or cancelled within 24 hours of placement. Contact support immediately.</p>
        <p><strong>After shipment:</strong> Orders cannot be cancelled, but you can refuse delivery or initiate a return once received.</p>
        <p><strong>To cancel an order:</strong></p>
        <ol>
          <li>Login to your account</li>
          <li>Go to "Order History"</li>
          <li>Find your order and click "Request Cancellation"</li>
          <li>Our team will process within 2 hours</li>
        </ol>
      `,
      keywords: ['cancel order', 'change order', 'modify', 'cancellation'],
      relatedLinks: [{ text: 'Order History', url: '/account/orders' }]
    },

    // PRODUCTS & CARE
    {
      id: 'prod-1',
      category: 'products',
      question: 'How should I care for Damascus steel products?',
      answer: `
        <p><strong>Damascus Steel Care Instructions:</strong></p>
        <ul>
          <li><strong>Cleaning:</strong> Hand wash with mild soap and warm water. Dry immediately.</li>
          <li><strong>Storage:</strong> Store in a dry place. Apply light coating of mineral oil to prevent oxidation.</li>
          <li><strong>Sharpening:</strong> Use whetstone (1000-3000 grit) at 15-20 degree angle.</li>
          <li><strong>Avoid:</strong> Dishwasher, acidic foods left on blade, harsh chemicals.</li>
        </ul>
        <p>Proper care ensures your Damascus steel blade lasts generations!</p>
      `,
      keywords: ['damascus steel', 'care', 'maintenance', 'cleaning', 'sharpening'],
      relatedLinks: []
    },
    {
      id: 'prod-2',
      category: 'products',
      question: 'How long does Aleppo soap last?',
      answer: `
        <p><strong>Shelf Life:</strong> Authentic Aleppo soap has a shelf life of 3-5 years when properly stored.</p>
        <p><strong>Aging Process:</strong> Aleppo soap actually improves with age! The longer it ages, the milder and more beneficial it becomes.</p>
        <p><strong>Storage Tips:</strong></p>
        <ul>
          <li>Keep in cool, dry place away from direct sunlight</li>
          <li>Ensure good air circulation</li>
          <li>Use soap dish with drainage to prevent softening</li>
        </ul>
        <p><strong>Usage:</strong> One 200g bar typically lasts 4-6 weeks with daily use.</p>
      `,
      keywords: ['aleppo soap', 'shelf life', 'storage', 'how long', 'aging'],
      relatedLinks: [{ text: 'Browse Aleppo Soap', url: '/category/beauty-wellness' }]
    },
    {
      id: 'prod-3',
      category: 'products',
      question: 'Are your products suitable for sensitive skin?',
      answer: `
        <p>Yes! Many of our traditional Syrian products are ideal for sensitive skin:</p>
        <ul>
          <li><strong>Aleppo Soap (40% laurel oil):</strong> Hypoallergenic, suitable for eczema and psoriasis</li>
          <li><strong>Syrian Rose Water:</strong> Natural toner for all skin types</li>
          <li><strong>Argan Oil:</strong> Pure, unrefined, excellent for sensitive skin</li>
        </ul>
        <p>All our beauty products are:</p>
        <ul>
          <li>Free from synthetic fragrances and parabens</li>
          <li>Not tested on animals</li>
          <li>Made with traditional natural ingredients</li>
        </ul>
        <p>Always patch test new products before full application.</p>
      `,
      keywords: ['sensitive skin', 'allergies', 'natural', 'hypoallergenic', 'aleppo soap'],
      relatedLinks: [{ text: 'Beauty & Wellness Products', url: '/category/beauty-wellness' }]
    }
  ];

  /**
   * Filtered FAQs based on search and category
   * @description Computed signal that filters FAQs by search query and selected category
   */
  filteredFaqs = computed(() => {
    let faqs = this.allFaqs;

    // Filter by category
    const category = this.selectedCategory();
    if (category && category !== 'all') {
      faqs = faqs.filter(faq => faq.category === category);
    }

    // Filter by search query
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      faqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.keywords.some(keyword => keyword.toLowerCase().includes(query))
      );
    }

    return faqs;
  });

  /**
   * Handle search input change
   * @description Triggers filtering when search query changes
   */
  onSearchChange(): void {
    // Reset category filter when searching
    if (this.searchQuery()) {
      this.selectedCategory.set(null);
    }
  }

  /**
   * Clear search query
   * @description Resets search and shows all FAQs
   */
  clearSearch(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('all');
  }

  /**
   * Filter FAQs by category
   * @description Sets the selected category and clears search
   * @param categoryId - ID of category to filter by
   */
  filterByCategory(categoryId: string): void {
    this.selectedCategory.set(categoryId);
    this.searchQuery.set('');
  }

  /**
   * Get category icon by category ID
   * @description Returns the icon name for a given category
   * @param categoryId - Category ID
   * @returns Icon name
   */
  getCategoryIcon(categoryId: string): string {
    const category = this.categories.find(cat => cat.id === categoryId);
    return category?.icon || 'help';
  }
}
