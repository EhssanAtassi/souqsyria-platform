import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Privacy Policy Page Component
 *
 * @description
 * Displays the SouqSyria privacy policy with bilingual support (English/Arabic).
 * Placeholder content for MVP1 — to be replaced with final legal copy.
 */
@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-neutral-50">
      <!-- Hero -->
      <section class="bg-gradient-to-br from-golden-wheat-lighter to-white py-16">
        <div class="container mx-auto px-4 text-center">
          <h1 class="text-4xl font-bold text-charcoal-dark mb-2">Privacy Policy</h1>
          <p class="text-lg text-neutral-600 font-arabic">سياسة الخصوصية</p>
        </div>
      </section>

      <!-- Content -->
      <section class="py-12">
        <div class="container mx-auto px-4 max-w-3xl">
          <div class="bg-white rounded-xl shadow-sm p-8 space-y-8">
            <div>
              <h2 class="text-2xl font-semibold text-charcoal-dark mb-4">1. Information We Collect</h2>
              <p class="text-neutral-600 leading-relaxed">
                SouqSyria collects personal information you provide when creating an account,
                placing orders, or contacting our support team. This includes your name, email
                address, shipping address, and payment information.
              </p>
            </div>

            <div>
              <h2 class="text-2xl font-semibold text-charcoal-dark mb-4">2. How We Use Your Information</h2>
              <p class="text-neutral-600 leading-relaxed">
                We use your information to process orders, communicate about your purchases,
                improve our services, and send promotional communications (with your consent).
              </p>
            </div>

            <div>
              <h2 class="text-2xl font-semibold text-charcoal-dark mb-4">3. Data Protection</h2>
              <p class="text-neutral-600 leading-relaxed">
                We implement industry-standard security measures to protect your personal data.
                All payment transactions are encrypted and we never store full credit card details.
              </p>
            </div>

            <div>
              <h2 class="text-2xl font-semibold text-charcoal-dark mb-4">4. Your Rights</h2>
              <p class="text-neutral-600 leading-relaxed">
                You have the right to access, correct, or delete your personal information.
                You may also opt out of promotional communications at any time.
              </p>
            </div>

            <div>
              <h2 class="text-2xl font-semibold text-charcoal-dark mb-4">5. Contact Us</h2>
              <p class="text-neutral-600 leading-relaxed">
                For privacy-related inquiries, please contact us at
                <a href="mailto:privacy@souqsyria.com" class="text-golden-wheat-dark hover:underline">
                  privacy&#64;souqsyria.com
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
export class PrivacyComponent {}
