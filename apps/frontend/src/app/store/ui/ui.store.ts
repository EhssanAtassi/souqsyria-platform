import { Store, StoreConfig } from '@datorama/akita';
import { Injectable } from '@angular/core';

/**
 * UI State Interface
 *
 * Defines the structure of UI-related application state
 */
export interface UIState {
  /** Global loading indicator state */
  isLoading: boolean;

  /** Sidebar (filters, navigation) open/closed state */
  isSidebarOpen: boolean;

  /** Mobile menu open/closed state */
  isMobileMenuOpen: boolean;

  /** Currently active modal identifier (null if no modal) */
  activeModal: string | null;

  /** Toast notification state */
  toast: {
    /** Toast message text */
    message: string;

    /** Toast type/severity */
    type: 'success' | 'error' | 'info' | 'warning';

    /** Toast visibility state */
    visible: boolean;
  } | null;
}

/**
 * UI Store
 *
 * Manages global UI state for the application.
 *
 * Features:
 * - Loading indicators
 * - Sidebar state management
 * - Mobile menu control
 * - Modal management
 * - Toast notifications
 *
 * Initial State:
 * - All UI elements closed/hidden
 * - No active modals
 * - No toast notifications
 *
 * @example
 * // Inject in component
 * constructor(private uiStore: UIStore) {}
 *
 * // Show loading indicator
 * this.uiStore.update({ isLoading: true });
 *
 * // Open sidebar
 * this.uiStore.update({ isSidebarOpen: true });
 */
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'ui' })
export class UIStore extends Store<UIState> {
  constructor() {
    super({
      isLoading: false,
      isSidebarOpen: false,
      isMobileMenuOpen: false,
      activeModal: null,
      toast: null
    });
  }
}
