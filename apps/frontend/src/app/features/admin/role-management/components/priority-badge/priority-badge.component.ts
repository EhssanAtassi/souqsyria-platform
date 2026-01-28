/**
 * Priority Badge Component
 *
 * @description
 * Displays role priority as a color-coded badge.
 * Priority ranges: Low (1-30), Medium (31-70), High (71-100)
 *
 * @swagger
 * components:
 *   PriorityBadge:
 *     type: object
 *     description: Color-coded priority badge
 */

import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatTooltipModule],
  template: `
    <mat-chip
      [class]="priorityClass()"
      [matTooltip]="'Priority: ' + priority() + ' (' + priorityLabel() + ')'"
      aria-label="Priority level">
      {{ priorityLabel() }}
    </mat-chip>
  `,
  styles: [`
    mat-chip {
      font-size: 11px;
      font-weight: 600;
      height: 24px;
      min-height: 24px;
      padding: 0 8px;

      &.priority-low {
        background-color: rgba(76, 175, 80, 0.15);
        color: #4caf50;
      }

      &.priority-medium {
        background-color: rgba(255, 152, 0, 0.15);
        color: #ff9800;
      }

      &.priority-high {
        background-color: rgba(244, 67, 54, 0.15);
        color: #f44336;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PriorityBadgeComponent {
  priority = input.required<number>();

  priorityLabel = computed(() => {
    const p = this.priority();
    if (p <= 30) return 'Low';
    if (p <= 70) return 'Medium';
    return 'High';
  });

  priorityClass = computed(() => {
    const p = this.priority();
    if (p <= 30) return 'priority-low';
    if (p <= 70) return 'priority-medium';
    return 'priority-high';
  });
}
