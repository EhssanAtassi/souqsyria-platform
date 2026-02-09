import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Global Footer Component
 *
 * @description
 * Site-wide footer with company info, navigation links, customer service,
 * and copyright. Bilingual (English/Arabic) with Golden Wheat theme.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {
  /** @description Current year for copyright display */
  readonly currentYear = new Date().getFullYear();
}
