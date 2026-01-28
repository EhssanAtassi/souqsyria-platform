/**
 * Severity Badge Component
 * 
 * @description Displays severity level for suspicious activity alerts.
 * Color-coded Material chip with uppercase severity text.
 * 
 * Color Coding:
 * - Gray (default): LOW severity
 * - Blue (primary): MEDIUM severity
 * - Orange (accent): HIGH severity
 * - Red (warn): CRITICAL severity
 * 
 * @example
 * ```html
 * <app-severity-badge [severity]="alert.severity" />
 * ```
 * 
 * @swagger
 * components:
 *   SeverityBadge:
 *     description: Visual indicator for alert severity levels
 *     properties:
 *       severity:
 *         type: string
 *         enum: [low, medium, high, critical]
 */

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';

import { SeverityLevel, getSeverityColor } from '../models';

@Component({
  selector: 'app-severity-badge',
  standalone: true,
  imports: [CommonModule, MatChipsModule, UpperCasePipe],
  template: `
    <mat-chip [color]="getColor()" selected [attr.aria-label]="'Severity: ' + severity">
      {{ severity | uppercase }}
    </mat-chip>
  `,
  styles: [
    `
      mat-chip {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.5px;
        min-height: 20px;
        padding: 2px 8px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeverityBadgeComponent {
  /**
   * Severity level to display
   */
  @Input({ required: true }) severity!: SeverityLevel;

  /**
   * Get Material color for severity level
   * 
   * @description Maps severity to appropriate Material theme color.
   * 
   * @returns Material color name
   */
  getColor(): string {
    return getSeverityColor(this.severity);
  }
}
