import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * SouqSyria Logo Component
 *
 * @description Standalone logo component matching the prototype exactly.
 * Displays the golden gradient icon with Arabic letter "س" and the brand name
 * with Arabic subtitle. Links to the homepage.
 *
 * @example
 * ```html
 * <app-logo></app-logo>
 * ```
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoComponent {}
