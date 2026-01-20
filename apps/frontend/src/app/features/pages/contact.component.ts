import { Component, ChangeDetectionStrategy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

/**
 * Contact Page Component
 *
 * @description
 * Comprehensive contact page for SouqSyria marketplace including:
 * - Contact form with Syrian governorate selection
 * - Damascus and Aleppo office information
 * - Customer support contact details
 * - Social media links
 * - FAQ quick links
 *
 * Features:
 * - Reactive form with validation
 * - Syrian phone number validation (+963 format)
 * - Email address validation
 * - Form submission with loading state
 * - Success/error messaging
 * - Bilingual content (English/Arabic)
 * - Golden Wheat design system styling
 *
 * @example
 * ```html
 * <app-contact></app-contact>
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     ContactComponent:
 *       type: object
 *       description: Syrian marketplace contact page with form and office information
 *       properties:
 *         contactForm:
 *           type: object
 *           required:
 *             - fullName
 *             - email
 *             - phone
 *             - governorate
 *             - subject
 *             - message
 *           properties:
 *             fullName:
 *               type: string
 *               minLength: 3
 *               description: User's full name
 *             email:
 *               type: string
 *               format: email
 *               description: User's email address
 *             phone:
 *               type: string
 *               pattern: ^\+963[0-9]{9,10}$
 *               description: Syrian phone number
 *             governorate:
 *               type: string
 *               enum: [damascus, aleppo, homs, latakia, hama, tartus, idlib, daraa, deir-ez-zor, al-hasakah, raqqa, as-suwayda, quneitra, rif-dimashq]
 *               description: Syrian governorate
 *             subject:
 *               type: string
 *               enum: [general, product, order, shipping, authenticity, partnership, technical, feedback]
 *               description: Message subject category
 *             message:
 *               type: string
 *               minLength: 10
 *               maxLength: 500
 *               description: User's message
 */
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent implements OnInit {
  /**
   * Contact form with validation
   * @description Reactive form for collecting user contact information and message
   */
  contactForm!: FormGroup;

  /**
   * Syrian governorates data for dropdown
   * @description All 14 Syrian governorates with English and Arabic names
   */
  readonly syrianGovernorates = signal([
    { value: 'damascus', nameEn: 'Damascus', nameAr: 'دمشق' },
    { value: 'aleppo', nameEn: 'Aleppo', nameAr: 'حلب' },
    { value: 'homs', nameEn: 'Homs', nameAr: 'حمص' },
    { value: 'latakia', nameEn: 'Latakia', nameAr: 'اللاذقية' },
    { value: 'hama', nameEn: 'Hama', nameAr: 'حماة' },
    { value: 'tartus', nameEn: 'Tartus', nameAr: 'طرطوس' },
    { value: 'idlib', nameEn: 'Idlib', nameAr: 'إدلب' },
    { value: 'daraa', nameEn: 'Daraa', nameAr: 'درعا' },
    { value: 'deir-ez-zor', nameEn: 'Deir ez-Zor', nameAr: 'دير الزور' },
    { value: 'al-hasakah', nameEn: 'Al-Hasakah', nameAr: 'الحسكة' },
    { value: 'raqqa', nameEn: 'Raqqa', nameAr: 'الرقة' },
    { value: 'as-suwayda', nameEn: 'As-Suwayda', nameAr: 'السويداء' },
    { value: 'quneitra', nameEn: 'Quneitra', nameAr: 'القنيطرة' },
    { value: 'rif-dimashq', nameEn: 'Rif Dimashq', nameAr: 'ريف دمشق' }
  ]);

  /**
   * Form submission loading state
   * @description Shows loading spinner while submitting form
   */
  isSubmitting = signal<boolean>(false);

  /**
   * Form submission success state
   * @description Shows success message after successful submission
   */
  submitSuccess = signal<boolean>(false);

  /**
   * Form submission error message
   * @description Shows error message if submission fails
   */
  submitError = signal<string | null>(null);

  /**
   * Component constructor
   * @param fb - FormBuilder service for creating reactive forms
   */
  constructor(private fb: FormBuilder) {}

  /**
   * Component initialization
   * @description Initializes the contact form with validation rules
   */
  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Initialize contact form with validators
   * @description Creates reactive form with all fields and validation rules
   * @private
   */
  private initializeForm(): void {
    this.contactForm = this.fb.group({
      fullName: ['', [
        Validators.required,
        Validators.minLength(3)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      phone: ['', [
        Validators.required,
        Validators.pattern(/^\+963[0-9]{9,10}$/)
      ]],
      governorate: ['', Validators.required],
      subject: ['', Validators.required],
      message: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500)
      ]]
    });
  }

  /**
   * Handle form submission
   * @description Validates and submits contact form data
   * @emits contactFormSubmit - Emits form data to backend API
   */
  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitSuccess.set(false);
    this.submitError.set(null);

    const formData = this.contactForm.value;

    // TODO: Replace with actual API call when backend is integrated
    // Example: this.contactService.submitForm(formData).subscribe(...)

    // Simulate API call with setTimeout (remove when real API is implemented)
    setTimeout(() => {
      // Simulate successful submission
      console.log('Contact form submitted:', formData);

      this.isSubmitting.set(false);
      this.submitSuccess.set(true);

      // Reset form after successful submission
      this.contactForm.reset();

      // Hide success message after 5 seconds
      setTimeout(() => {
        this.submitSuccess.set(false);
      }, 5000);

      // TODO: Uncomment when real API is implemented
      // this.isSubmitting.set(false);
      // this.submitError.set('Failed to send message. Please try again later.');
    }, 2000);
  }

  /**
   * Get form control for error handling in template
   * @param controlName - Name of form control
   * @returns FormControl or null
   * @deprecated Use contactForm.get(controlName) directly in template
   */
  getFormControl(controlName: string) {
    return this.contactForm.get(controlName);
  }
}
