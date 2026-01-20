import { Injectable, inject } from '@angular/core';
import { UIStore } from './ui.store';
import { UIQuery } from './ui.query';

/**
 * UI Service
 *
 * Business logic for UI state management.
 *
 * Features:
 * - Loading indicator control
 * - Sidebar management
 * - Mobile menu control
 * - Modal management
 * - Toast notifications
 *
 * @example
 * // In component
 * constructor(private uiService: UIService) {}
 *
 * showLoading() {
 *   this.uiService.setLoading(true);
 * }
 *
 * showSuccess() {
 *   this.uiService.showToast('Operation successful', 'success');
 * }
 *
 * openModal() {
 *   this.uiService.openModal('product-details');
 * }
 */
@Injectable({ providedIn: 'root' })
export class UIService {
  private store = inject(UIStore);
  private query = inject(UIQuery);

  /** Expose UI observables */
  isLoading$ = this.query.isLoading$;
  isSidebarOpen$ = this.query.isSidebarOpen$;
  isMobileMenuOpen$ = this.query.isMobileMenuOpen$;
  activeModal$ = this.query.activeModal$;
  toast$ = this.query.toast$;

  /**
   * Set Loading State
   *
   * Shows or hides the global loading indicator.
   *
   * @param isLoading - True to show loading, false to hide
   */
  setLoading(isLoading: boolean) {
    this.store.update({ isLoading });
  }

  /**
   * Open Sidebar
   *
   * Opens the sidebar (filters, navigation, etc.)
   */
  openSidebar() {
    this.store.update({ isSidebarOpen: true });
  }

  /**
   * Close Sidebar
   */
  closeSidebar() {
    this.store.update({ isSidebarOpen: false });
  }

  /**
   * Toggle Sidebar
   *
   * Switches sidebar between open and closed states
   */
  toggleSidebar() {
    const currentState = this.query.getValue().isSidebarOpen;
    this.store.update({ isSidebarOpen: !currentState });
  }

  /**
   * Open Mobile Menu
   */
  openMobileMenu() {
    this.store.update({ isMobileMenuOpen: true });
  }

  /**
   * Close Mobile Menu
   */
  closeMobileMenu() {
    this.store.update({ isMobileMenuOpen: false });
  }

  /**
   * Toggle Mobile Menu
   *
   * Switches mobile menu between open and closed states
   */
  toggleMobileMenu() {
    const currentState = this.query.getValue().isMobileMenuOpen;
    this.store.update({ isMobileMenuOpen: !currentState });
  }

  /**
   * Open Modal
   *
   * Opens a modal with the specified identifier.
   * Automatically closes any previously open modal.
   *
   * @param modalId - Unique modal identifier
   */
  openModal(modalId: string) {
    this.store.update({ activeModal: modalId });
  }

  /**
   * Close Modal
   *
   * Closes the currently active modal
   */
  closeModal() {
    this.store.update({ activeModal: null });
  }

  /**
   * Close Specific Modal
   *
   * Closes a modal only if it's the currently active one.
   *
   * @param modalId - Modal identifier to close
   */
  closeModalById(modalId: string) {
    if (this.query.isModalActive(modalId)) {
      this.closeModal();
    }
  }

  /**
   * Show Toast Notification
   *
   * Displays a toast notification with auto-hide after 3 seconds.
   *
   * @param message - Toast message text
   * @param type - Toast type (success, error, info, warning)
   * @param duration - Duration in milliseconds (default: 3000)
   */
  showToast(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration: number = 3000
  ) {
    this.store.update({
      toast: {
        message,
        type,
        visible: true
      }
    });

    // Auto-hide toast after duration
    if (duration > 0) {
      setTimeout(() => {
        this.hideToast();
      }, duration);
    }
  }

  /**
   * Hide Toast
   *
   * Manually hides the current toast notification
   */
  hideToast() {
    this.store.update({ toast: null });
  }

  /**
   * Show Success Toast
   *
   * Convenience method for success notifications
   *
   * @param message - Success message
   */
  showSuccess(message: string) {
    this.showToast(message, 'success');
  }

  /**
   * Show Error Toast
   *
   * Convenience method for error notifications
   *
   * @param message - Error message
   */
  showError(message: string) {
    this.showToast(message, 'error', 5000); // Longer duration for errors
  }

  /**
   * Show Info Toast
   *
   * Convenience method for informational notifications
   *
   * @param message - Info message
   */
  showInfo(message: string) {
    this.showToast(message, 'info');
  }

  /**
   * Show Warning Toast
   *
   * Convenience method for warning notifications
   *
   * @param message - Warning message
   */
  showWarning(message: string) {
    this.showToast(message, 'warning', 4000);
  }

  /**
   * Close All UI Elements
   *
   * Closes all drawers, menus, and modals
   */
  closeAll() {
    this.store.update({
      isSidebarOpen: false,
      isMobileMenuOpen: false,
      activeModal: null
    });
  }
}
