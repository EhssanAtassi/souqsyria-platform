/**
 * System Role Badge Component
 *
 * @description
 * Displays a lock icon indicator for system roles that cannot be modified.
 *
 * @swagger
 * components:
 *   SystemRoleBadge:
 *     type: object
 *     description: System role lock indicator
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-system-role-badge',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <mat-icon
      class="system-badge"
      matTooltip="System role - Cannot be modified or deleted"
      aria-label="System role">
      lock
    </mat-icon>
  `,
  styles: [`
    .system-badge {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--mat-warn, #f44336);
      flex-shrink: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SystemRoleBadgeComponent {}
