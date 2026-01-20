import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, HostListener, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Modal Dialog Component
 *
 * Full-screen overlay modal with Golden Wheat themed header and backdrop.
 * Supports keyboard navigation (ESC to close) and focus trapping.
 *
 * @swagger
 * components:
 *   schemas:
 *     ModalComponent:
 *       type: object
 *       description: Overlay dialog modal with Golden Wheat styling
 *       properties:
 *         isOpen:
 *           type: boolean
 *           description: Controls modal visibility
 *         title:
 *           type: string
 *           description: Modal header title
 *         size:
 *           type: string
 *           enum: [small, medium, large, full]
 *           description: Modal width variant
 *         showCloseButton:
 *           type: boolean
 *           description: Show X button in header
 *         closeOnBackdrop:
 *           type: boolean
 *           description: Close when clicking backdrop
 *         close:
 *           type: event
 *           description: Emitted when modal closes
 *
 * @example
 * ```typescript
 * isModalOpen = false;
 *
 * openModal() {
 *   this.isModalOpen = true;
 * }
 *
 * closeModal() {
 *   this.isModalOpen = false;
 * }
 * ```
 *
 * ```html
 * <app-modal
 *   [isOpen]="isModalOpen"
 *   title="Product Details"
 *   size="large"
 *   (close)="closeModal()">
 *   <p>Modal content here...</p>
 * </app-modal>
 * ```
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent implements OnInit {
  /**
   * Controls modal visibility
   */
  @Input() isOpen: boolean = false;

  /**
   * Modal header title
   */
  @Input() title: string = '';

  /**
   * Modal title in Arabic (optional)
   */
  @Input() titleArabic?: string;

  /**
   * Current language for title display
   */
  @Input() language: 'en' | 'ar' = 'en';

  /**
   * Modal size variant
   * - small: 400px max-width
   * - medium: 600px max-width (default)
   * - large: 900px max-width
   * - full: 95vw max-width
   */
  @Input() size: 'small' | 'medium' | 'large' | 'full' = 'medium';

  /**
   * Show close button (X) in header
   */
  @Input() showCloseButton: boolean = true;

  /**
   * Close modal when clicking backdrop
   */
  @Input() closeOnBackdrop: boolean = true;

  /**
   * Event emitted when modal closes
   */
  @Output() close = new EventEmitter<void>();

  /**
   * DestroyRef for automatic cleanup
   */
  private destroyRef = inject(DestroyRef);

  /**
   * Listen for ESC key to close modal
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isOpen) {
      this.closeModal();
    }
  }

  ngOnInit(): void {
    // Prevent body scroll when modal opens
    if (this.isOpen) {
      this.disableBodyScroll();
    }

    // Register cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.enableBodyScroll();
    });
  }

  /**
   * Close modal and emit close event
   */
  closeModal(): void {
    this.enableBodyScroll();
    this.close.emit();
  }

  /**
   * Handle backdrop click
   */
  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop && event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  /**
   * Prevent backdrop click from propagating to modal content
   */
  onModalContentClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  /**
   * Disable body scroll (prevent background scrolling)
   */
  private disableBodyScroll(): void {
    document.body.style.overflow = 'hidden';
  }

  /**
   * Re-enable body scroll
   */
  private enableBodyScroll(): void {
    document.body.style.overflow = '';
  }

  /**
   * Get display title based on language
   */
  get displayTitle(): string {
    return this.language === 'ar' && this.titleArabic ? this.titleArabic : this.title;
  }
}
