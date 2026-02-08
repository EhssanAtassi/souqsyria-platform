import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * @description Product skeleton loader component
 * Displays a loading placeholder that matches product card dimensions
 * Used during data fetching to improve perceived performance
 */
@Component({
  selector: 'app-product-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-skeleton.component.html',
  styleUrls: ['./product-skeleton.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductSkeletonComponent {}
