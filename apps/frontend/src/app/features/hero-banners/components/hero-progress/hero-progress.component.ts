/**
 * Hero Progress Component (Presentational/Dumb Component)
 * Displays animated progress bar for autoplay timing
 *
 * Pure presentational component
 */

import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './hero-progress.component.html',
  styleUrl: './hero-progress.component.scss',
})
export class HeroProgressComponent {
  /**
   * Progress percentage (0-100)
   * @default 0
   */
  @Input() progress: number = 0;

  /**
   * Show/hide progress bar
   * @default true
   */
  @Input() visible: boolean = true;

  /**
   * Progress bar color theme
   * @default 'golden-wheat'
   */
  @Input() color: 'golden-wheat' | 'forest' | 'deep-umber' = 'golden-wheat';
}
