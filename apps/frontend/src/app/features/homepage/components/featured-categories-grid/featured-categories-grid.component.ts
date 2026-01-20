import {
  Component,
  input,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/**
 * Featured Category interface
 */
export interface FeaturedCategory {
  id: number;
  name: string;
  nameAr: string;
  icon: string;
  color: string;
  discount?: string;
  slug: string;
}

/**
 * Featured Categories Grid Component
 *
 * Displays a 2x2 grid of featured categories with:
 * - Material Design icon
 * - Category name (English + Arabic)
 * - Colored background for visual differentiation
 * - Optional discount badge
 * - Click navigation to category page
 *
 * @Input categories - Array of featured categories to display
 */
@Component({
  selector: 'app-featured-categories-grid',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule
  ],
  templateUrl: './featured-categories-grid.component.html',
  styleUrl: './featured-categories-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturedCategoriesGridComponent {
  // Input: Featured categories from parent
  categories = input<FeaturedCategory[]>([]);
}
