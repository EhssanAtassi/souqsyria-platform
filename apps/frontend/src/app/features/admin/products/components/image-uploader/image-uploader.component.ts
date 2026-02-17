/**
 * @file image-uploader.component.ts
 * @description Simplified image uploader component for product images.
 *              Displays existing images and provides UI for reordering and management.
 * @module AdminDashboard/Products/Components
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Product image interface
 */
export interface ProductImage {
  id: number;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

/**
 * Image Uploader Component
 * @description Simplified image management UI for product images.
 *
 * @features
 * - Display existing product images
 * - Mark primary/main image
 * - Reorder images via drag handles (visual only)
 * - Edit alt text
 * - Drag-and-drop zone (visual only)
 *
 * @example
 * ```html
 * <app-image-uploader
 *   [images]="productImages"
 *   (imagesChange)="handleImagesChange($event)"
 *   (primaryChange)="handlePrimaryChange($event)"
 * ></app-image-uploader>
 * ```
 */
@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-uploader.component.html',
  styleUrl: './image-uploader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageUploaderComponent {
  // =========================================================================
  // INPUTS & OUTPUTS
  // =========================================================================

  /**
   * Product images
   */
  @Input()
  set images(value: ProductImage[]) {
    this.imageList.set([...value].sort((a, b) => a.sortOrder - b.sortOrder));
  }

  /**
   * Images change event
   */
  @Output() imagesChange = new EventEmitter<ProductImage[]>();

  /**
   * Primary image change event
   */
  @Output() primaryChange = new EventEmitter<number>();

  /**
   * Delete image event
   */
  @Output() deleteImage = new EventEmitter<number>();

  // =========================================================================
  // STATE SIGNALS
  // =========================================================================

  /**
   * Image list signal
   */
  readonly imageList = signal<ProductImage[]>([]);

  /**
   * Drag over state
   */
  readonly isDragOver = signal(false);

  /**
   * Editing alt text state
   */
  readonly editingAltTextId = signal<number | null>(null);

  /**
   * Primary image
   */
  readonly primaryImage = computed(() => {
    return this.imageList().find(img => img.isPrimary) || this.imageList()[0] || null;
  });

  /**
   * Has images
   */
  readonly hasImages = computed(() => this.imageList().length > 0);

  // =========================================================================
  // DRAG & DROP HANDLERS
  // =========================================================================

  /**
   * Handle drag over
   * @param event - Drag event
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  /**
   * Handle drag leave
   * @param event - Drag event
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  /**
   * Handle drop
   * @param event - Drag event
   * @description Visual only - actual upload would require backend integration
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);

    // Visual feedback only
    console.log('Drop event detected. File upload requires backend integration.');
  }

  /**
   * Handle file input change
   * @param event - File input event
   * @description Visual only - actual upload would require backend integration
   */
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      console.log(`Selected ${input.files.length} file(s). Upload requires backend integration.`);
    }
  }

  // =========================================================================
  // IMAGE MANAGEMENT
  // =========================================================================

  /**
   * Set primary image
   * @param imageId - Image ID to set as primary
   */
  setPrimary(imageId: number): void {
    const images = this.imageList().map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));
    this.imageList.set(images);
    this.primaryChange.emit(imageId);
    this.imagesChange.emit(images);
  }

  /**
   * Start editing alt text
   * @param imageId - Image ID
   */
  startEditAltText(imageId: number): void {
    this.editingAltTextId.set(imageId);
  }

  /**
   * Save alt text
   * @param imageId - Image ID
   * @param newAltText - New alt text value
   */
  saveAltText(imageId: number, newAltText: string): void {
    const images = this.imageList().map(img =>
      img.id === imageId ? { ...img, altText: newAltText } : img
    );
    this.imageList.set(images);
    this.editingAltTextId.set(null);
    this.imagesChange.emit(images);
  }

  /**
   * Cancel editing alt text
   */
  cancelEditAltText(): void {
    this.editingAltTextId.set(null);
  }

  /**
   * Delete image
   * @param imageId - Image ID to delete
   */
  onDeleteImage(imageId: number): void {
    this.deleteImage.emit(imageId);
  }

  /**
   * Move image up in order
   * @param index - Current index
   */
  moveUp(index: number): void {
    if (index === 0) return;

    const images = [...this.imageList()];
    [images[index - 1], images[index]] = [images[index], images[index - 1]];

    // Update sort order
    const updatedImages = images.map((img, idx) => ({
      ...img,
      sortOrder: idx
    }));

    this.imageList.set(updatedImages);
    this.imagesChange.emit(updatedImages);
  }

  /**
   * Move image down in order
   * @param index - Current index
   */
  moveDown(index: number): void {
    const images = [...this.imageList()];
    if (index === images.length - 1) return;

    [images[index], images[index + 1]] = [images[index + 1], images[index]];

    // Update sort order
    const updatedImages = images.map((img, idx) => ({
      ...img,
      sortOrder: idx
    }));

    this.imageList.set(updatedImages);
    this.imagesChange.emit(updatedImages);
  }

  // =========================================================================
  // TRACK BY
  // =========================================================================

  /**
   * Track images by ID
   * @param index - Index
   * @param image - Image
   * @returns Image ID
   */
  trackByImageId(index: number, image: ProductImage): number {
    return image.id;
  }
}
