/**
 * @file material-imports.ts
 * @description Optimized Angular Material imports for tree-shaking and bundle size reduction
 * @module Shared/Material
 */

// Core Material modules - Import only what's needed
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';

/**
 * Essential Material modules for core functionality
 * Use this for components that need basic Material Design features
 */
export const CORE_MATERIAL_MODULES = [
  MatButtonModule,
  MatIconModule,
  MatCardModule,
  MatFormFieldModule,
  MatInputModule,
  MatProgressSpinnerModule,
  MatSnackBarModule
] as const;

/**
 * Navigation-related Material modules
 * Use this for layout and navigation components
 */
export const NAVIGATION_MATERIAL_MODULES = [
  MatToolbarModule,
  MatSidenavModule,
  MatListModule,
  MatMenuModule,
  MatBadgeModule,
  MatTabsModule
] as const;

/**
 * Data display Material modules
 * Use this for tables, lists, and data presentation
 */
export const DATA_MATERIAL_MODULES = [
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatExpansionModule,
  MatTooltipModule
] as const;

/**
 * Form-related Material modules
 * Use this for forms and input components
 */
export const FORM_MATERIAL_MODULES = [
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatCheckboxModule,
  MatRadioModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatChipsModule
] as const;

/**
 * Overlay Material modules
 * Use this for dialogs, tooltips, and overlays
 */
export const OVERLAY_MATERIAL_MODULES = [
  MatDialogModule,
  MatTooltipModule,
  MatMenuModule,
  MatSnackBarModule
] as const;

/**
 * Progress Material modules
 * Use this for loading states and progress indicators
 */
export const PROGRESS_MATERIAL_MODULES = [
  MatProgressSpinnerModule,
  MatProgressBarModule
] as const;

/**
 * Complete Material modules collection
 * Only use this when you need most Material components in a feature module
 * WARNING: This increases bundle size significantly
 */
export const ALL_MATERIAL_MODULES = [
  ...CORE_MATERIAL_MODULES,
  ...NAVIGATION_MATERIAL_MODULES,
  ...DATA_MATERIAL_MODULES,
  ...FORM_MATERIAL_MODULES,
  ...OVERLAY_MATERIAL_MODULES,
  ...PROGRESS_MATERIAL_MODULES
] as const;

/**
 * Admin-specific Material modules
 * Optimized for admin dashboard components
 */
export const ADMIN_MATERIAL_MODULES = [
  // Core essentials
  MatButtonModule,
  MatIconModule,
  MatCardModule,
  MatToolbarModule,
  MatSidenavModule,
  
  // Data display
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatListModule,
  
  // Forms
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatCheckboxModule,
  MatDatepickerModule,
  MatNativeDateModule,
  
  // Overlays
  MatDialogModule,
  MatSnackBarModule,
  MatTooltipModule,
  MatMenuModule,
  
  // Progress
  MatProgressSpinnerModule,
  MatProgressBarModule,
  
  // Navigation
  MatTabsModule,
  MatBadgeModule,
  
  // Additional admin features
  MatExpansionModule,
  MatChipsModule
] as const;

/**
 * Minimal Material modules for lightweight components
 * Use this for simple components with basic Material styling
 */
export const MINIMAL_MATERIAL_MODULES = [
  MatButtonModule,
  MatIconModule,
  MatCardModule,
  MatProgressSpinnerModule
] as const;

/**
 * Material theme configuration
 */
export interface MaterialThemeConfig {
  /** Primary color palette */
  primary: string;
  /** Accent color palette */
  accent: string;
  /** Warn color palette */
  warn: string;
  /** Dark theme enabled */
  darkTheme: boolean;
  /** Typography scale */
  typography: 'default' | 'dense' | 'compact';
  /** Animation duration scale */
  animationDuration: 'default' | 'fast' | 'slow' | 'disabled';
}

/**
 * Default Material theme configuration optimized for performance
 */
export const DEFAULT_MATERIAL_THEME: MaterialThemeConfig = {
  primary: '#1e3a8a', // Blue-800
  accent: '#10b981',  // Emerald-500
  warn: '#ef4444',    // Red-500
  darkTheme: false,
  typography: 'default',
  animationDuration: 'fast' // Faster animations for better perceived performance
};

/**
 * Material icons configuration for optimal loading
 */
export interface MaterialIconsConfig {
  /** Icon font loading strategy */
  fontDisplay: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  /** Preload critical icons */
  preloadCriticalIcons: boolean;
  /** Use outlined icons (lighter weight) */
  useOutlinedIcons: boolean;
  /** Custom icon registry */
  customIcons?: Record<string, string>;
}

/**
 * Optimized Material icons configuration
 */
export const OPTIMIZED_ICONS_CONFIG: MaterialIconsConfig = {
  fontDisplay: 'swap', // Faster text rendering
  preloadCriticalIcons: true,
  useOutlinedIcons: true, // Smaller file size
  customIcons: {
    // Define custom SVG icons for frequently used ones
    'dashboard': 'assets/icons/dashboard.svg',
    'analytics': 'assets/icons/analytics.svg',
    'settings': 'assets/icons/settings.svg'
  }
};

/**
 * Bundle optimization utilities for Material Design
 */
export class MaterialOptimizationService {
  /**
   * Dynamically import Material modules based on component needs
   */
  static async loadMaterialModules(moduleType: 'core' | 'admin' | 'minimal' | 'all') {
    switch (moduleType) {
      case 'core':
        return CORE_MATERIAL_MODULES;
      case 'admin':
        return ADMIN_MATERIAL_MODULES;
      case 'minimal':
        return MINIMAL_MATERIAL_MODULES;
      case 'all':
        console.warn('Loading all Material modules - consider using specific module groups for better performance');
        return ALL_MATERIAL_MODULES;
      default:
        return CORE_MATERIAL_MODULES;
    }
  }

  /**
   * Calculate estimated bundle size impact
   */
  static estimateBundleImpact(modules: readonly any[]): number {
    // Rough estimates in KB
    const moduleWeights: Record<string, number> = {
      'MatButtonModule': 15,
      'MatIconModule': 8,
      'MatTableModule': 45,
      'MatDialogModule': 25,
      'MatDatepickerModule': 35,
      'MatFormFieldModule': 20,
      'MatInputModule': 15,
      'MatSelectModule': 30,
      'MatToolbarModule': 12,
      'MatSidenavModule': 22,
      'MatCardModule': 8,
      'MatListModule': 15,
      'MatTabsModule': 28,
      'MatMenuModule': 18,
      'MatExpansionModule': 20,
      'MatPaginatorModule': 15,
      'MatSortModule': 10,
      'MatCheckboxModule': 10,
      'MatRadioModule': 12,
      'MatProgressSpinnerModule': 5,
      'MatProgressBarModule': 5,
      'MatSnackBarModule': 12,
      'MatTooltipModule': 15,
      'MatBadgeModule': 5,
      'MatChipsModule': 18,
      'MatNativeDateModule': 25
    };

    return modules.reduce((total, module) => {
      const moduleName = module.constructor?.name || module.name;
      return total + (moduleWeights[moduleName] || 10);
    }, 0);
  }

  /**
   * Get recommended modules for component type
   */
  static getRecommendedModules(componentType: string): readonly any[] {
    const recommendations: Record<string, readonly any[]> = {
      'dashboard': ADMIN_MATERIAL_MODULES,
      'table': [...CORE_MATERIAL_MODULES, ...DATA_MATERIAL_MODULES],
      'form': [...CORE_MATERIAL_MODULES, ...FORM_MATERIAL_MODULES],
      'dialog': [...MINIMAL_MATERIAL_MODULES, ...OVERLAY_MATERIAL_MODULES],
      'navigation': [...CORE_MATERIAL_MODULES, ...NAVIGATION_MATERIAL_MODULES],
      'simple': MINIMAL_MATERIAL_MODULES
    };

    return recommendations[componentType] || CORE_MATERIAL_MODULES;
  }

  /**
   * Analyze unused Material modules (for build optimization)
   */
  static analyzeUnusedModules(usedModules: string[]): string[] {
    const allModuleNames = ALL_MATERIAL_MODULES.map(module => 
      module.constructor?.name || module.name
    );

    return allModuleNames.filter(moduleName => 
      !usedModules.includes(moduleName)
    );
  }
}

/**
 * Tree-shaking optimization hints
 */
export const TREE_SHAKING_HINTS = {
  // Always import specific modules, never the entire library
  goodImport: `import { MatButtonModule } from '@angular/material/button';`,
  badImport: `import * as Material from '@angular/material';`,
  
  // Use specific icon names instead of dynamic icon loading where possible
  goodIconUsage: `<mat-icon>dashboard</mat-icon>`,
  badIconUsage: `<mat-icon>{{ dynamicIconName }}</mat-icon>`,
  
  // Prefer CSS classes over programmatic styling
  goodStyling: `class="mat-elevation-z4"`,
  badStyling: `[ngStyle]="{ boxShadow: elevation }"`,
  
  // Use OnPush change detection with Material components
  goodChangeDetection: `changeDetection: ChangeDetectionStrategy.OnPush`,
  badChangeDetection: `// Default change detection strategy`
} as const;