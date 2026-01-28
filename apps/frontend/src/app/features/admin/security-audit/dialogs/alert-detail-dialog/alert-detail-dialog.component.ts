/**
 * Alert Detail Dialog Component
 * 
 * @description Dialog displaying full details of a suspicious activity alert.
 * 
 * @example
 * ```typescript
 * this.dialog.open(AlertDetailDialogComponent, { width: '700px', data: alert });
 * ```
 */

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { SuspiciousActivityAlert } from '../../models';
import { SeverityBadgeComponent } from '../../components/severity-badge.component';

@Component({
  selector: 'app-alert-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    SeverityBadgeComponent,
  ],
  templateUrl: './alert-detail-dialog.component.html',
  styleUrls: ['./alert-detail-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertDetailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<AlertDetailDialogComponent>);
  readonly alert: SuspiciousActivityAlert = inject(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }
}
