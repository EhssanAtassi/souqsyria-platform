import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface OfferCard {
  id: string;
  imageUrl: string;
  title: string;
  linkUrl: string;
}

@Component({
  selector: 'app-offer-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offer-cards.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styleUrls: ['./offer-cards.component.scss']
})
export class OfferCardsComponent {
  @Input() offers: OfferCard[] = [
    {
      id: 'iphone-offer',
      imageUrl: '/assets/images/offers/iphone-offer.jpg',
      title: 'iPhone 17 Pro Offer',
      linkUrl: '/offers/iphone-17'
    },
    {
      id: 'tech-appliances',
      imageUrl: '/assets/images/offers/tech-appliances.jpg',
      title: 'Tech & Appliances',
      linkUrl: '/offers/tech-appliances'
    },
    {
      id: 'electronics-deals',
      imageUrl: '/assets/images/offers/electronics-deals.jpg',
      title: 'Electronics Daily Deals',
      linkUrl: '/offers/electronics-deals'
    }
  ];

  constructor(private router: Router) {
  }

  onCardClick(offer: OfferCard): void {
    this.router.navigate([offer.linkUrl]);
  }
}
