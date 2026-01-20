import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';

export interface Offer {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  imageUrl: string;
  offerUrl: string;
  discount?: string;
  isActive: boolean;
  bgGradient: string;
  textColor: string;
}

@Component({
  selector: 'app-offers-section',
  standalone: true,
  imports: [CommonModule, MatRippleModule],
  templateUrl: './offers-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrls: ['./offers-section.component.scss']
})
export class OffersSectionComponent {
  @Input() offers: Offer[] = [];
  @Input() sectionTitle: string = 'Special Offers';
  @Input() sectionTitleAr: string = 'العروض الخاصة';

  constructor(private router: Router) {
  }

  onOfferClick(offer: Offer): void {
    if (offer.isActive && offer.offerUrl) {
      this.router.navigate([offer.offerUrl]);
    }
  }

  trackByOfferId(index: number, offer: Offer): string {
    return offer.id;
  }
}
