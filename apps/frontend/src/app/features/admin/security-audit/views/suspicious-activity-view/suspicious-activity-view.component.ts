/**
 * Suspicious Activity View Component
 * 
 * @description Displays and manages suspicious activity alerts.
 * Shows unresolved alerts with actions to view details or resolve.
 * 
 * @example
 * ```html
 * <app-suspicious-activity-view />
 * ```
 */

import { Component, inject, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { SecurityAuditQuery } from '../../state/security-audit.query';
import { SecurityAuditService } from '../../state/security-audit.service';
import { SeverityBadgeComponent } from '../../components/severity-badge.component';
import { SuspiciousActivityAlert, SeverityLevel, getSeverityColor } from '../../models';
import { AlertDetailDialogComponent } from '../../dialogs/alert-detail-dialog/alert-detail-dialog.component';

@Component({
  selector: 'app-suspicious-activity-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    SeverityBadgeComponent,
  ],
  templateUrl: './suspicious-activity-view.component.html',
  styleUrls: ['./suspicious-activity-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuspiciousActivityViewComponent {
  private readonly query = inject(SecurityAuditQuery);
  private readonly service = inject(SecurityAuditService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly unresolvedAlerts$ = this.query.unresolvedAlerts$;

  getSeverityIcon(severity: SeverityLevel): string {
    const icons: Record<SeverityLevel, string> = {
      low: 'info',
      medium: 'warning',
      high: 'error',
      critical: 'report',
    };
    return icons[severity] || 'warning';
  }

  getSeverityColor(severity: SeverityLevel): string {
    return getSeverityColor(severity);
  }

  viewAlertDetails(alert: SuspiciousActivityAlert): void {
    this.dialog.open(AlertDetailDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: alert,
      autoFocus: false,
    });
  }

  resolveAlert(alertId: string): void {
    this.service
      .resolveAlert(alertId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
