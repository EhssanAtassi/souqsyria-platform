import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Favorites/Wishlist Button Component
 *
 * @description Standalone heart icon button with red badge count.
 * Navigates to the wishlist page on click.
 *
 * @swagger
 * components:
 *   schemas:
 *     FavoritesButtonProps:
 *       type: object
 *       properties:
 *         count:
 *           type: number
 *           description: Number of items in wishlist
 *         language:
 *           type: string
 *           enum: [en, ar]
 *
 * @example
 * ```html
 * <app-favorites-button [count]="5" (favoritesClick)="onFavClick()"></app-favorites-button>
 * ```
 */
@Component({
  selector: 'app-favorites-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favorites-button.component.html',
  styleUrl: './favorites-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoritesButtonComponent {
  /** Number of items in wishlist */
  @Input() count = 0;

  /** Current language for accessible labels */
  @Input() language: 'en' | 'ar' = 'en';

  /** Emitted when the favorites button is clicked */
  @Output() favoritesClick = new EventEmitter<void>();

  /** Get accessible aria label */
  get ariaLabel(): string {
    return this.language === 'ar'
      ? `المفضلة (${this.count})`
      : `Wishlist (${this.count})`;
  }
}
