import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SliderImageSwiperComponent } from './components/slider-image-swiper/slider-image-swiper.component';

@Component({
  selector: 'app-slider-demo',
  standalone: true,
  imports: [CommonModule, SliderImageSwiperComponent],
  templateUrl: './slider-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .slider-demo-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      font-family: 'Inter', sans-serif;
    }

    h2 {
      color: #333;
      margin-bottom: 30px;
      font-size: 24px;
      font-weight: 600;
    }

    .demo-section {
      margin-bottom: 40px;
      padding: 20px;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      background: #fff;
    }

    h3 {
      color: #495057;
      margin-bottom: 15px;
      font-size: 18px;
      font-weight: 500;
    }

    .demo-wrapper {
      display: flex;
      justify-content: center;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 6px;
      min-height: 220px;
      align-items: center;
    }

    @media (max-width: 768px) {
      .slider-demo-container {
        padding: 10px;
      }

      .demo-section {
        padding: 15px;
      }
    }
  `]
})
export class SliderDemoComponent {
  // Multiple images for main demo
  heroImages = [
    {
      src: 'assets/products/damascus-knife-main.jpg',
      alt: 'Damascus Steel Knife',
      link: '/products/damascus-knife'
    },
    {
      src: 'assets/products/aleppo-soap-main.jpg',
      alt: 'Traditional Aleppo Soap',
      link: '/products/aleppo-soap'
    },
    {
      src: 'assets/products/damascus-jewelry-box-main.jpg',
      alt: 'Damascus Jewelry Box'
      // No link - will use offerBaseUrl + category
    },
    {
      src: 'assets/products/baklava-gift-box-main.jpg',
      alt: 'Baklava Gift Box',
      link: '/products/baklava-gift'
    },
    {
      src: 'assets/products/brocade-fabric-main.jpg',
      alt: 'Syrian Brocade Fabric',
      link: '/categories/textiles'
    }
  ];

  // Single image demo
  singleImage = [
    {
      src: 'assets/products/olive-oil-bottle-main.jpg',
      alt: 'Premium Syrian Olive Oil',
      link: '/products/olive-oil'
    }
  ];

  // Custom link demo
  customLinkImages = [
    {
      src: 'assets/products/ceramic-plates-set-main.jpg',
      alt: 'Handmade Ceramic Plates',
      link: '/collections/ceramics'
    },
    {
      src: 'assets/products/damascus-mosaic-main.jpg',
      alt: 'Damascus Mosaic Art',
      link: '/art/damascus-mosaic'
    },
    {
      src: 'assets/products/aleppo-pistachios-main.jpg',
      alt: 'Aleppo Pistachios',
      link: '/food/nuts-dried-fruits'
    }
  ];

  constructor() {
    console.log('SliderDemoComponent initialized with', this.heroImages.length, 'hero images');
  }
}
