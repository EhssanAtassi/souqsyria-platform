import { Component, OnInit, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  AutoMappingSuggestion,
  SuggestionConfidence
} from '../../models/auto-mapping.model';
import { MethodBadgeComponent } from '../../components/method-badge/method-badge.component';

/**
 * Input data for the Auto-Map Dialog
 */
export interface AutoMapDialogData {
  /**
   * Array of AI-generated mapping suggestions
   */
  suggestions: AutoMappingSuggestion[];

  /**
   * Total number of suggestions generated
   */
  totalSuggestions: number;
}

/**
 * Result returned when dialog is closed with confirmation
 */
export interface AutoMapDialogResult {
  /**
   * Array of approved suggestions to apply
   */
  approvedSuggestions: AutoMappingSuggestion[];

  /**
   * Total count of approved mappings
   */
  approvedCount: number;
}

/**
 * AutoMapDialogComponent
 *
 * Dialog for previewing and approving AI-generated route-to-permission mappings.
 * Features:
 * - Review AI suggestions with confidence scores
 * - Approve/reject individual suggestions
 * - Bulk actions (approve all, reject all, approve high confidence)
 * - Expandable reason explanations
 * - Color-coded confidence levels
 *
 * @example
 * ```typescript
 * const dialogRef = this.dialog.open(AutoMapDialogComponent, {
 *   width: '800px',
 *   maxHeight: '80vh',
 *   data: {
 *     suggestions: autoMappingSuggestions,
 *     totalSuggestions: 45
 *   }
 * });
 *
 * dialogRef.afterClosed().subscribe((result: AutoMapDialogResult) => {
 *   if (result) {
 *     // Apply approved mappings
 *   }
 * });
 * ```
 */
@Component({
  selector: 'app-auto-map-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    MatExpansionModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MethodBadgeComponent
  ],
  templateUrl: './auto-map-dialog.component.html',
  styleUrls: ['./auto-map-dialog.component.scss']
})
export class AutoMapDialogComponent implements OnInit {
  /**
   * Map to track approval status of each suggestion
   * Key: suggestion routeId, Value: approved boolean
   */
  approvalMap = signal<Map<string, boolean>>(new Map());

  /**
   * Loading state during async operations
   */
  loading = signal(false);

  /**
   * Computed count of approved suggestions
   */
  approvedCount = computed(() => {
    let count = 0;
    this.approvalMap().forEach(approved => {
      if (approved) count++;
    });
    return count;
  });

  /**
   * Computed count of high confidence suggestions
   */
  highConfidenceCount = computed(() => {
    return this.data.suggestions.filter(
      s => s.suggestedPermission.confidence >= 0.8
    ).length;
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AutoMapDialogData,
    private dialogRef: MatDialogRef<AutoMapDialogComponent, AutoMapDialogResult>,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Initializes the component and sets up initial approval states
   */
  ngOnInit(): void {
    // Initialize approval map (all start as unapproved)
    const map = new Map<string, boolean>();
    this.data.suggestions.forEach(suggestion => {
      map.set(suggestion.routeId, false);
    });
    this.approvalMap.set(map);
  }

  /**
   * Toggles approval status for a single suggestion
   *
   * @param suggestion - The suggestion to toggle
   */
  toggleApproval(suggestion: AutoMappingSuggestion): void {
    const map = new Map(this.approvalMap());
    const currentValue = map.get(suggestion.routeId) || false;
    map.set(suggestion.routeId, !currentValue);
    this.approvalMap.set(map);
  }

  /**
   * Checks if a suggestion is approved
   *
   * @param suggestion - The suggestion to check
   * @returns True if approved
   */
  isApproved(suggestion: AutoMappingSuggestion): boolean {
    return this.approvalMap().get(suggestion.routeId) || false;
  }

  /**
   * Approves all suggestions
   */
  approveAll(): void {
    const map = new Map<string, boolean>();
    this.data.suggestions.forEach(suggestion => {
      map.set(suggestion.routeId, true);
    });
    this.approvalMap.set(map);

    this.snackBar.open('All suggestions approved', 'Close', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Rejects all suggestions
   */
  rejectAll(): void {
    const map = new Map<string, boolean>();
    this.data.suggestions.forEach(suggestion => {
      map.set(suggestion.routeId, false);
    });
    this.approvalMap.set(map);

    this.snackBar.open('All suggestions rejected', 'Close', {
      duration: 2000,
      panelClass: ['info-snackbar']
    });
  }

  /**
   * Approves only high confidence suggestions (>= 80%)
   */
  approveHighConfidence(): void {
    const map = new Map<string, boolean>();
    this.data.suggestions.forEach(suggestion => {
      const isHighConfidence = suggestion.suggestedPermission.confidence >= 0.8;
      map.set(suggestion.routeId, isHighConfidence);
    });
    this.approvalMap.set(map);

    this.snackBar.open(
      `${this.highConfidenceCount()} high confidence suggestions approved`,
      'Close',
      {
        duration: 2000,
        panelClass: ['success-snackbar']
      }
    );
  }

  /**
   * Gets the Material color for confidence chip
   *
   * @param confidence - Confidence score (0-1)
   * @returns Material color name
   */
  getConfidenceColor(confidence: number): 'primary' | 'accent' | 'warn' {
    if (confidence >= 0.8) return 'primary'; // Green
    if (confidence >= 0.6) return 'accent';  // Yellow/Orange
    return 'warn'; // Red
  }

  /**
   * Gets the confidence level label
   *
   * @param confidence - Confidence score (0-1)
   * @returns Confidence level string
   */
  getConfidenceLevel(confidence: number): SuggestionConfidence {
    if (confidence >= 0.9) return 'high';
    if (confidence >= 0.7) return 'medium';
    return 'low';
  }

  /**
   * Handles apply action
   * Collects approved suggestions and closes dialog
   */
  onApply(): void {
    const approvedSuggestions = this.data.suggestions.filter(suggestion =>
      this.isApproved(suggestion)
    );

    if (approvedSuggestions.length === 0) {
      this.snackBar.open('No suggestions approved', 'Close', {
        duration: 3000,
        panelClass: ['warn-snackbar']
      });
      return;
    }

    this.loading.set(true);

    // Simulate async operation
    setTimeout(() => {
      this.loading.set(false);

      const result: AutoMapDialogResult = {
        approvedSuggestions,
        approvedCount: approvedSuggestions.length
      };

      this.dialogRef.close(result);

      this.snackBar.open(
        `Applying ${approvedSuggestions.length} mapping${approvedSuggestions.length !== 1 ? 's' : ''}`,
        'Close',
        {
          duration: 3000,
          panelClass: ['success-snackbar']
        }
      );
    }, 500);
  }

  /**
   * Handles cancel action
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Tracks suggestions in ngFor for performance
   *
   * @param index - Index in array
   * @param suggestion - Suggestion object
   * @returns Unique identifier
   */
  trackBySuggestion(index: number, suggestion: AutoMappingSuggestion): string {
    return suggestion.routeId;
  }
}
