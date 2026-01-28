/**
 * Event Detail Dialog Component
 * 
 * @description Dialog displaying full details of a security audit event.
 * 
 * @example
 * ```typescript
 * this.dialog.open(EventDetailDialogComponent, { width: '700px', data: event });
 * ```
 */

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { SecurityAuditEvent } from '../../models';
import { ActionBadgeComponent } from '../../components/action-badge.component';
import { SuccessIndicatorComponent } from '../../components/success-indicator.component';

@Component({
  selector: 'app-event-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    ActionBadgeComponent,
    SuccessIndicatorComponent,
  ],
  templateUrl: './event-detail-dialog.component.html',
  styleUrls: ['./event-detail-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<EventDetailDialogComponent>);
  readonly event: SecurityAuditEvent = inject(MAT_DIALOG_DATA);

  close(): void {
    this.dialogRef.close();
  }

  getMetadataKeys(): string[] {
    return this.event.metadata ? Object.keys(this.event.metadata) : [];
  }

  formatMetadataValue(value: any): string {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }
}
