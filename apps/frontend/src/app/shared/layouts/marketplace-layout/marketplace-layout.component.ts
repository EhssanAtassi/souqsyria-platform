import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Marketplace Layout Component
 *
 * Reusable 2-column layout (sidebar 33% / content 67%) with RTL support
 * Used in: Homepage, Category pages, Search results
 *
 * @description
 * Provides a responsive grid layout with sidebar and main content slots.
 * Supports RTL languages and sticky sidebar positioning.
 * Uses ng-content for flexible content projection.
 *
 * @example
 * ```html
 * <app-marketplace-layout [language]="'ar'" [sidebarPosition]="'right'">
 *   <div sidebar>Sidebar content</div>
 *   <div content>Main content</div>
 * </app-marketplace-layout>
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     MarketplaceLayoutComponent:
 *       type: object
 *       description: Reusable 2-column layout with sidebar and content areas
 *       properties:
 *         language:
 *           type: string
 *           enum: [en, ar]
 *           description: Display language for RTL/LTR support
 *           default: en
 *         sidebarPosition:
 *           type: string
 *           enum: [left, right]
 *           description: Position of sidebar
 *           default: left
 *         stickyHeader:
 *           type: boolean
 *           description: Enable sticky positioning for sidebar
 *           default: true
 */
@Component({
  selector: 'app-marketplace-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './marketplace-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrl: './marketplace-layout.component.scss'
})
export class MarketplaceLayoutComponent {
  /**
   * Display language for RTL/LTR support
   * @default 'en'
   */
  readonly language = input<'en' | 'ar'>('en');

  /**
   * Position of sidebar (left for LTR, right for RTL)
   * @default 'left'
   */
  readonly sidebarPosition = input<'left' | 'right'>('left');

  /**
   * Enable sticky positioning for sidebar
   * @default true
   */
  readonly stickyHeader = input<boolean>(true);

  // Content projection slots:
  // - sidebar: Left/right sidebar content
  // - content: Main content area
}
