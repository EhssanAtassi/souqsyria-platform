/**
 * Success Indicator Component
 * 
 * @description Displays a visual indicator (icon) showing success or failure status.
 * Used to quickly identify event outcomes in audit logs.
 * 
 * Visual Indicators:
 * - Green check circle: Success (success === true)
 * - Red cancel circle: Failure (success === false)
 * 
 * @example
 * ```html
 * <app-success-indicator [success]="event.success" />
 * ```
 * 
 * @swagger
 * components:
 *   SuccessIndicator:
 *     description: Visual success/failure indicator
 *     properties:
 *       success:
 *         type: boolean
 *         description: Whether the action succeeded
 */

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-success-indicator',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <mat-icon
      [color]="success ? 'primary' : 'warn'"
      [matTooltip]="success ? 'Success' : 'Failed'"
      class="status-icon">
      {{ success ? 'check_circle' : 'cancel' }}
    </mat-icon>
  `,
  styles: [
    `
      .status-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        vertical-align: middle;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuccessIndicatorComponent {
  /**
   * Success status to display
   * 
   * @description True shows success icon, false shows failure icon.
   */
  @Input({ required: true }) success!: boolean;
}
