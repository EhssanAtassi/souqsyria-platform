import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Terms of Service Page Component
 *
 * @description
 * Displays the SouqSyria terms of service with bilingual support (English/Arabic).
 * Placeholder content for MVP1 — to be replaced with final legal copy.
 */
@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-neutral-50">
      <!-- Hero -->
      <section class="bg-gradient-to-br from-golden-wheat-lighter to-white py-16">
        <div class="container mx-auto px-4 text-center">
          <h1 class="text-4xl font-bold text-charcoal-dark mb-2">Terms of Service</h1>
          <p class="text-lg text-neutral-600 font-arabic">شروط الخدمة</p>
        </div>
      </section>

      <!-- Content -->
      <section class="py-12">
        <div class="container mx-auto px-4 max-w-3xl">
          <div class="bg-white rounded-xl shadow-sm p-8 space-y-8">
            <div>
              <h2 class="text-2xl font-semibold text-charcoal-dark mb-4">1. Acceptance of Terms</h2>
              <p class="text-neutral-600 leading-relaxed">
                By accessing and using SouqSyria, you agree to be bound by these Terms of Service.
                If you do not agree with any part of these terms, please do not use our platform.
              </p>
            </div>

            <div>
              <h2 class="text-2xl font-semibold text-charcoal-dark mb-4">2. User Accounts</h2>
              <p class="text-neutral-600 leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials.
                You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </div>

            <div>
              <h2 class="text-2xl font-semibold text-charcoal-dark mb-4">3. Products and Orders</h2>
              <p class="text-neutral-600 leading-relaxed">
                All products listed on SouqSyria are subject to availability. We reserve the right
                to limit quantities and refuse orders at our discretion. Prices are subject to
                change without notice.
              </p>
            </div>

            <div>
              <h2 class="text-2xl font-semibold text-charcoal-dark mb-4">4. Intellectual Property</h2>
              <p class="text-neutral-600 leading-relaxed">
                All content on SouqSyria, including text, graphics, logos, and images, is the
                property of SouqSyria or its content suppliers and is protected by intellectual
                property laws.
              </p>
            </div>

            <div>
              <h2 class="text-2xl font-semibold text-charcoal-dark mb-4">5. Limitation of Liability</h2>
              <p class="text-neutral-600 leading-relaxed">
                SouqSyria shall not be liable for any indirect, incidental, or consequential
                damages arising from the use of our platform or products purchased through it.
              </p>
            </div>

            <div>
              <h2 class="text-2xl font-semibold text-charcoal-dark mb-4">6. Contact</h2>
              <p class="text-neutral-600 leading-relaxed">
                For questions about these terms, please contact us at
                <a href="mailto:legal@souqsyria.com" class="text-golden-wheat-dark hover:underline">
                  legal&#64;souqsyria.com
                </a>
              </p>
            </div>

            <p class="text-sm text-neutral-400 pt-4 border-t border-neutral-200">
              Last updated: February 2026
            </p>
          </div>

          <div class="text-center mt-8">
            <a routerLink="/" class="text-golden-wheat-dark hover:underline">
              &larr; Back to Home
            </a>
          </div>
        </div>
      </section>
    </div>
  `
})
export class TermsComponent {}
