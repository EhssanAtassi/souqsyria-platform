# Hero Banner 70/30 Component System

Complete implementation of the SouqSyria hero banner with 70/30 split layout (carousel + promo cards).

## Overview

The hero banner features a **70% carousel area** for rotating hero banners and a **30% sidebar area** for stacked promotional cards, creating an engaging e-commerce homepage experience.

```
┌──────────────────────────────────────────────────────────┐
│  70% Hero Carousel        │  30% Promo Cards Sidebar    │
│  ┌──────────────────────┐ │  ┌────────────────────────┐ │
│  │  Banner 1 (Damascus) │ │  │  Top Promo Card        │ │
│  │  Banner 2 (Aleppo)   │ │  │  (Damascus Steel)      │ │
│  │  Banner 3 (Textiles) │ │  └────────────────────────┘ │
│  │  Banner 4 (Spices)   │ │  ┌────────────────────────┐ │
│  │  Banner 5 (Crafts)   │ │  │  Bottom Promo Card     │ │
│  └──────────────────────┘ │  │  (Aleppo Soap)         │ │
│  [< > dots progress]      │  └────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Components

### 1. HeroBanner7030Component (Smart Component)
**Location:** `src/app/shared/components/hero-banner-70-30/`

Main container component that orchestrates the 70/30 layout:
- Loads hero banners and promo cards from service
- Manages loading and error states
- Tracks analytics for both carousel and promo cards
- Responsive breakpoints (stacks on mobile)

**Usage:**
```html
<app-hero-banner-70-30 />
```

### 2. PromoCardComponent (Dumb Component)
**Location:** `src/app/shared/components/promo-card/`

Presentational component for promotional cards with 70/30 content/image split:
- 70% content area (headline, description, accent bar)
- 30% image area (product/category image)
- Bilingual support (Arabic RTL / English LTR)
- Discount badge overlay
- Click tracking via output event

**Usage:**
```html
<app-promo-card
  [promoCard]="topPromoCard()"
  [position]="0"
  (cardClick)="onPromoCardClick($event)"
/>
```

### 3. HeroSkeletonComponent (Loading State)
**Location:** `src/app/shared/components/hero-skeleton/`

Skeleton loader matching the final 70/30 layout:
- Shimmer animation for visual feedback
- Matches carousel and promo card dimensions
- Accessibility support (prefers-reduced-motion)

**Usage:**
```html
@if (loading()) {
  <app-hero-skeleton />
} @else {
  <app-hero-banner-70-30 />
}
```

## Interfaces

### PromoCard Interface
**Location:** `src/app/shared/interfaces/promo-card.interface.ts`

Complete type definitions for promotional cards:
- `PromoCard` - Main interface with bilingual content
- `PromoCardImage` - Image configuration with focal point
- `DiscountBadge` - Badge configuration with position
- `PromoCardRoute` - Navigation and tracking
- `PromoCardAnalytics` - Performance metrics

## Service Methods

### HeroBannerService Updates
**Location:** `src/app/features/hero-banners/services/hero-banner.service.ts`

New methods added:
- `getPromoCards(limit: number = 2): Observable<PromoCard[]>` - Fetch promo cards with caching
- `trackPromoCardImpression(promoCardId: string, metadata?: any): Observable<void>` - Track impressions
- `trackPromoCardClick(promoCardId: string, metadata?: any): Observable<void>` - Track clicks
- `getMockPromoCards(): Observable<PromoCard[]>` - Mock data for offline development

## Features

### Responsive Design
- **Desktop (1024px+):** Horizontal 70/30 split
- **Tablet (768px-1023px):** Horizontal 70/30 split (smaller gaps)
- **Mobile (<768px):** Vertical stack (carousel top, promo cards bottom)

### Bilingual Support
- Arabic RTL layout support
- English LTR layout support
- Language detection from localStorage or navigator
- Bilingual content for all text fields

### Analytics Tracking
- Hero banner impressions and clicks
- Promo card impressions and clicks
- CTA button interactions
- Position tracking (0=top, 1=bottom)
- UTM tracking parameters

### Golden Wheat Theme
Theme colors available:
- `golden-wheat` - Primary brand color (#D4A574)
- `forest` - Secondary color (#2C5F2D)
- `charcoal` - Text/UI color (#36454F)
- `deep-umber` - Accent color (#6F4E37)
- `syrian-red` - Syrian flag red (#CE1126)
- `syrian-gold` - Traditional Syrian gold (#C9B037)

### Accessibility
- ARIA labels for screen readers
- Keyboard navigation support
- Focus visible states
- High contrast mode support
- Reduced motion support

## Data Flow

```
Homepage Component
       ↓
HeroBanner7030Component (Smart)
       ↓
   ┌───┴────────────────┐
   ↓                    ↓
HeroBannerService  HeroBannerService
.getActiveHeroBanners()  .getPromoCards(2)
   ↓                    ↓
HeroContainerComponent  PromoCardComponent (x2)
(70% carousel)         (30% sidebar)
```

## Implementation Checklist

### Frontend ✅ (Complete)
- [x] Create PromoCard interface
- [x] Create PromoCardComponent
- [x] Create HeroSkeletonComponent
- [x] Update HeroBannerService with promo card methods
- [x] Create HeroBanner7030Component
- [x] Add responsive breakpoints
- [x] Add bilingual support
- [x] Add analytics tracking

### Backend ⏳ (Pending)
- [ ] Create PromoCard entity
- [ ] Create PromoCard DTOs
- [ ] Create PromoCards service
- [ ] Create PromoCards controller
- [ ] Create PromoCards module & migration
- [ ] Add analytics endpoints

## Testing

### Component Testing
Test the components in isolation:

```bash
# Unit tests
ng test --include='**/promo-card.component.spec.ts'
ng test --include='**/hero-skeleton.component.spec.ts'
ng test --include='**/hero-banner-70-30.component.spec.ts'

# E2E tests
ng e2e
```

### Test URLs
Once integrated into homepage:
- http://192.168.1.101:4200/ (Homepage with hero banner)
- http://192.168.1.101:4200/?lang=ar (Arabic RTL test)
- http://192.168.1.101:4200/?lang=en (English LTR test)

## Mock Data

The service provides mock data for offline development:

### Hero Banners (5 slides)
1. Damascus Steel Heritage Collection
2. UNESCO Heritage Aleppo Soap
3. Syrian Brocade & Textiles
4. Syrian Spices (to be added)
5. Traditional Crafts (to be added)

### Promo Cards (2 cards)
1. **Top Card:** Damascus Steel Collection (20% OFF)
2. **Bottom Card:** Premium Aleppo Soap (40% OFF)

## Integration Guide

### Step 1: Import in Homepage Component
```typescript
import { HeroBanner7030Component } from '@app/shared/components/hero-banner-70-30';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [HeroBanner7030Component],
  template: `
    <app-hero-banner-70-30 />
  `
})
export class HomepageComponent {}
```

### Step 2: Remove Old Hero Banner
Replace any existing hero banner components with the new 70/30 layout.

### Step 3: Test Responsiveness
Test on different screen sizes:
- Desktop: 1920x1080
- Tablet: 768x1024
- Mobile: 375x667

### Step 4: Verify Analytics
Check browser console for analytics events:
- `📊 Tracked impression for banner`
- `📊 Tracked promo card impression`
- `📊 Promo Card Click`

## Performance Optimizations

- **OnPush Change Detection:** All components use OnPush for better performance
- **Caching:** 5-minute cache for hero banners and promo cards
- **Lazy Loading:** Images use `loading="lazy"` attribute
- **ShareReplay:** RxJS shareReplay prevents duplicate API calls
- **Computed Signals:** Reactive computed values for derived state

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari 14+
- Chrome Mobile 90+

## Known Issues

None at this time.

## Future Enhancements

- [ ] Add A/B testing support
- [ ] Add video support in hero banners
- [ ] Add parallax scrolling effect
- [ ] Add personalization based on user preferences
- [ ] Add scheduled content rotation
- [ ] Add geo-targeting for different regions

## Support

For questions or issues, contact the development team or check the main project documentation.
