import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

/**
 * About Page Component
 *
 * @description
 * Displays comprehensive information about SouqSyria marketplace including:
 * - Company mission and values
 * - Syrian heritage and cultural authenticity
 * - Governorate coverage across Syria
 * - Quality and authenticity guarantees
 * - Artisan partnerships and fair trade practices
 *
 * Features bilingual content (English/Arabic) and Golden Wheat design system styling.
 *
 * @example
 * ```html
 * <app-about></app-about>
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     AboutComponent:
 *       type: object
 *       description: Syrian marketplace about page with heritage information
 *       properties:
 *         sections:
 *           type: array
 *           items:
 *             type: string
 *           description: Page sections (hero, mission, story, values, coverage, cta)
 */
@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent {}