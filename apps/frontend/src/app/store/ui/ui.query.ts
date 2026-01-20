import { Query } from '@datorama/akita';
import { Injectable } from '@angular/core';
import { UIStore, UIState } from './ui.store';

/**
 * UI Query Service
 *
 * Provides reactive queries for UI state.
 * All UI state access should go through this query service.
 *
 * Features:
 * - Reactive UI observables
 * - Loading state
 * - Sidebar state
 * - Mobile menu state
 * - Modal state
 * - Toast notifications
 *
 * @example
 * // In component
 * constructor(private uiQuery: UIQuery) {}
 *
 * ngOnInit() {
 *   // Subscribe to loading state
 *   this.uiQuery.isLoading$.subscribe(loading => {
 *     console.log('Loading:', loading);
 *   });
 *
 *   // Subscribe to sidebar state
 *   this.uiQuery.isSidebarOpen$.subscribe(isOpen => {
 *     console.log('Sidebar open:', isOpen);
 *   });
 * }
 */
@Injectable({ providedIn: 'root' })
export class UIQuery extends Query<UIState> {

  /** Observable of complete UI state */
  ui$ = this.select();

  /** Observable of global loading state */
  isLoading$ = this.select('isLoading');

  /** Observable of sidebar open/closed state */
  isSidebarOpen$ = this.select('isSidebarOpen');

  /** Observable of mobile menu open/closed state */
  isMobileMenuOpen$ = this.select('isMobileMenuOpen');

  /** Observable of active modal identifier */
  activeModal$ = this.select('activeModal');

  /** Observable of toast notification */
  toast$ = this.select('toast');

  constructor(protected override store: UIStore) {
    super(store);
  }

  /**
   * Check if Specific Modal is Active
   *
   * @param modalId - Modal identifier to check
   * @returns True if the specified modal is active
   */
  isModalActive(modalId: string): boolean {
    return this.getValue().activeModal === modalId;
  }

  /**
   * Check if Any Modal is Active
   *
   * @returns True if any modal is currently open
   */
  hasActiveModal(): boolean {
    return this.getValue().activeModal !== null;
  }

  /**
   * Get Current Active Modal
   *
   * @returns Active modal identifier or null
   */
  getActiveModal(): string | null {
    return this.getValue().activeModal;
  }
}
