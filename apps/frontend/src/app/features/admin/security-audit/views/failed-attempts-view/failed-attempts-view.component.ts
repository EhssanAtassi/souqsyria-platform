/**
 * Failed Attempts View Component
 * 
 * @description Displays filtered view of failed access attempts.
 * Shows only events where success === false.
 * 
 * @example
 * ```html
 * <app-failed-attempts-view />
 * ```
 */

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { SecurityAuditQuery } from '../../state/security-audit.query';
import { ActionBadgeComponent } from '../../components/action-badge.component';

@Component({
  selector: 'app-failed-attempts-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    ActionBadgeComponent,
  ],
  templateUrl: './failed-attempts-view.component.html',
  styleUrls: ['./failed-attempts-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FailedAttemptsViewComponent {
  private readonly query = inject(SecurityAuditQuery);

  readonly failedEvents$ = this.query.failedEvents$;
}
