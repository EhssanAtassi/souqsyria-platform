import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Bulk Actions Bar Component
 *
 * Toolbar displayed when routes are selected in the list view.
 * Provides batch operations for selected routes:
 * - Bulk link permissions
 * - Bulk unlink permissions
 * - Deselect all
 *
 * @example
 * ```html
 * <app-bulk-actions-bar
 *   [selectedCount]="5"
 *   (bulkLink)="handleBulkLink()"
 *   (bulkUnlink)="handleBulkUnlink()"
 *   (deselectAll)="handleDeselectAll()">
 * </app-bulk-actions-bar>
 * ```
 */
@Component({
  selector: 'app-bulk-actions-bar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <mat-toolbar color="accent" class="bulk-actions-bar">
      <div class="bulk-actions-bar__content">
        <div class="bulk-actions-bar__info">
          <mat-icon class="bulk-actions-bar__icon">check_circle</mat-icon>
          <span class="bulk-actions-bar__text">
            <strong>{{ selectedCount() }}</strong>
            {{ selectedCount() === 1 ? 'route' : 'routes' }} selected
          </span>
        </div>

        <div class="bulk-actions-bar__actions">
          <button
            mat-button
            (click)="bulkLink.emit()"
            class="bulk-actions-bar__button"
            aria-label="Bulk link permissions to selected routes">
            <mat-icon>link</mat-icon>
            <span>Link Permissions</span>
          </button>

          <button
            mat-button
            (click)="bulkUnlink.emit()"
            class="bulk-actions-bar__button"
            aria-label="Bulk unlink permissions from selected routes">
            <mat-icon>link_off</mat-icon>
            <span>Unlink Permissions</span>
          </button>

          <div class="bulk-actions-bar__divider"></div>

          <button
            mat-button
            (click)="deselectAll.emit()"
            class="bulk-actions-bar__button bulk-actions-bar__button--deselect"
            aria-label="Deselect all routes">
            <mat-icon>close</mat-icon>
            <span>Deselect All</span>
          </button>
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    @use '@angular/material' as mat;

    .bulk-actions-bar {
      margin: 0 16px 16px 16px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      animation: slideDown 300ms cubic-bezier(0.4, 0, 0.2, 1);

      &__content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 24px;
      }

      &__info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      &__icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      &__text {
        font-size: 16px;
        font-weight: 400;

        strong {
          font-weight: 600;
        }
      }

      &__actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      &__divider {
        width: 1px;
        height: 32px;
        background-color: rgba(255, 255, 255, 0.3);
        margin: 0 8px;
      }

      &__button {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        padding: 0 16px;
        height: 40px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }

        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        &--deselect {
          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    // Responsive Design
    @media (max-width: 768px) {
      .bulk-actions-bar {
        &__content {
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
        }

        &__actions {
          justify-content: space-between;
        }

        &__divider {
          display: none;
        }

        &__button {
          flex: 1;
          justify-content: center;

          span {
            display: none;
          }

          mat-icon {
            margin: 0;
          }
        }
      }
    }

    // High Contrast Mode
    @media (prefers-contrast: high) {
      .bulk-actions-bar {
        border: 2px solid currentColor;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkActionsBarComponent {
  /**
   * Number of selected routes
   */
  readonly selectedCount = input.required<number>();

  /**
   * Event emitted when bulk link action triggered
   */
  readonly bulkLink = output<void>();

  /**
   * Event emitted when bulk unlink action triggered
   */
  readonly bulkUnlink = output<void>();

  /**
   * Event emitted when deselect all action triggered
   */
  readonly deselectAll = output<void>();
}
