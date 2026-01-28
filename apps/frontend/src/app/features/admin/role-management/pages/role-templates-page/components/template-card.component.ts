/**
 * Template Card Component
 *
 * @description
 * Displays a role template card with preview and use actions.
 * Presentational component for template gallery.
 *
 * @features
 * - Template information display
 * - Icon and color theming
 * - Permission count badge
 * - Preview and use actions
 * - Category chip display
 * - Hover elevation effect
 *
 * @architecture
 * - Dumb/Presentational component
 * - OnPush change detection
 * - No service injection
 * - Pure input/output communication
 *
 * @swagger
 * components:
 *   TemplateCard:
 *     type: object
 *     description: Card display of a role template
 *
 * @example
 * ```html
 * <app-template-card
 *   [template]="template"
 *   (preview)="onPreview(template)"
 *   (use)="onUseTemplate(template)">
 * </app-template-card>
 * ```
 */

import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';

import { RoleTemplate } from '../../../models';

/**
 * Template Card Component
 *
 * @class TemplateCardComponent
 */
@Component({
  selector: 'app-template-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatBadgeModule,
  ],
  templateUrl: './template-card.component.html',
  styleUrls: ['./template-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'template-card',
    '[attr.role]': '"article"',
    '[attr.aria-label]': '"Template: " + template().name',
  },
})
export class TemplateCardComponent {
  /**
   * Input: Template data
   *
   * @description
   * Role template to display in card.
   *
   * @type {RoleTemplate}
   */
  template = input.required<RoleTemplate>();

  /**
   * Output: Preview event
   *
   * @description
   * Emitted when preview button is clicked.
   *
   * @emits {void}
   */
  preview = output<void>();

  /**
   * Output: Use template event
   *
   * @description
   * Emitted when "Use Template" button is clicked.
   *
   * @emits {void}
   */
  use = output<void>();

  /**
   * Handle preview button click
   *
   * @description
   * Prevents event propagation and emits preview event.
   *
   * @param {Event} event - Click event
   *
   * @public
   */
  onPreviewClick(event: Event): void {
    event.stopPropagation();
    this.preview.emit();
  }

  /**
   * Handle use template button click
   *
   * @description
   * Prevents event propagation and emits use event.
   *
   * @param {Event} event - Click event
   *
   * @public
   */
  onUseClick(event: Event): void {
    event.stopPropagation();
    this.use.emit();
  }

  /**
   * Get truncated description
   *
   * @description
   * Limits description to 120 characters with ellipsis.
   *
   * @returns {string} Truncated description
   *
   * @public
   */
  getTruncatedDescription(): string {
    const description = this.template().description;
    if (!description) return '';

    return description.length > 120
      ? description.substring(0, 120) + '...'
      : description;
  }

  /**
   * Get category display name
   *
   * @description
   * Converts category slug to human-readable format.
   *
   * @returns {string} Formatted category name
   *
   * @public
   */
  getCategoryDisplay(): string {
    const category = this.template().category;
    return category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
