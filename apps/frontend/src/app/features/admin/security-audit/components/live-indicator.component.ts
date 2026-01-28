/**
 * Live Indicator Component
 * 
 * @description Displays animated indicator showing live mode status.
 * Pulsing dot animation when enabled, static when disabled.
 * 
 * Visual States:
 * - LIVE (enabled): Green pulsing dot with "LIVE" text
 * - PAUSED (disabled): Gray static dot with "PAUSED" text
 * 
 * @example
 * ```html
 * <app-live-indicator [enabled]="liveMode$ | async" />
 * ```
 * 
 * @swagger
 * components:
 *   LiveIndicator:
 *     description: Visual indicator for real-time streaming status
 *     properties:
 *       enabled:
 *         type: boolean
 *         description: Whether live mode is active
 */

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-live-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="live-indicator" [class.active]="enabled">
      <span class="pulse-dot"></span>
      <span class="label">{{ enabled ? 'LIVE' : 'PAUSED' }}</span>
    </div>
  `,
  styles: [
    `
      .live-indicator {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 16px;
        background: rgba(0, 0, 0, 0.05);
        transition: background 0.3s ease;

        &.active {
          background: rgba(76, 175, 80, 0.15);
        }
      }

      .pulse-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #9e9e9e;
        transition: background 0.3s ease;

        .active & {
          background: #4caf50;
          animation: pulse 2s infinite ease-in-out;
        }
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.5;
          transform: scale(1.5);
        }
      }

      .label {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.5px;
        color: #9e9e9e;
        transition: color 0.3s ease;

        .active & {
          color: #4caf50;
        }
      }

      // Dark theme
      .dark-theme {
        .live-indicator {
          background: rgba(255, 255, 255, 0.05);

          &.active {
            background: rgba(76, 175, 80, 0.2);
          }
        }

        .pulse-dot {
          background: #757575;

          .active & {
            background: #66bb6a;
          }
        }

        .label {
          color: #bdbdbd;

          .active & {
            color: #66bb6a;
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveIndicatorComponent {
  /**
   * Whether live mode is enabled
   *
   * @description Controls visual state and animation of the indicator.
   * Accepts null to handle async pipe initial state.
   */
  @Input() enabled: boolean | null = false;
}
