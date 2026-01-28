/**
 * Template Preview Dialog Component
 * TODO: Implement template preview functionality
 */

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { RoleTemplate } from '../../models';

@Component({
  selector: 'app-template-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatListModule, MatChipsModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ data.template.icon || 'admin_panel_settings' }}</mat-icon>
      {{ data.template.name }}
    </h2>
    <mat-dialog-content>
      <p class="description">{{ data.template.description }}</p>
      <h3>Permissions ({{ data.template.permissions?.length || 0 }})</h3>
      <mat-chip-set>
        @for (perm of data.template.permissions; track perm.id) {
          <mat-chip>{{ perm.name }}</mat-chip>
        }
      </mat-chip-set>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="true">
        Use Template
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .description { font-size: 14px; color: var(--mat-text-secondary); margin-bottom: 16px; }
    h3 { margin: 16px 0 8px 0; font-size: 16px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplatePreviewDialogComponent {
  readonly data = inject<{ template: RoleTemplate }>(MAT_DIALOG_DATA);
}
