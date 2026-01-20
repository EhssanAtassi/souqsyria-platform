import { Component, ChangeDetectionStrategy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignHeroComponent } from './campaign-hero.component';
import { Campaign } from '../../../shared/interfaces/campaign.interface';

/**
 * Demo Component for Campaign Hero with Swiper Integration
 *
 * This component demonstrates how to use the upgraded CampaignHeroComponent
 * with Swiper 12.0.1 library integration for smooth carousel functionality.
 *
 * @swagger
 * components:
 *   schemas:
 *     CampaignHeroDemoComponent:
 *       type: object
 *       description: Demo component showcasing Swiper-powered campaign hero
 */
@Component({
  selector: 'app-campaign-hero-demo',
  standalone: true,
  imports: [
    CommonModule,
    CampaignHeroComponent
  ],
  templateUrl: './campaign-hero-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .demo-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .demo-title {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 1rem;
      color: #C41E3A;
    }

    .demo-description {
      font-size: 1.1rem;
      margin-bottom: 2rem;
      color: #6B7280;
      line-height: 1.6;
    }

    .demo-info {
      margin-top: 2rem;
      padding: 1.5rem;
      background: #F9FAFB;
      border-radius: 0.5rem;
      border: 1px solid #E5E7EB;
    }

    .demo-info h3 {
      margin-bottom: 1rem;
      color: #1F2937;
      font-weight: 600;
    }

    .demo-info ul {
      list-style: none;
      padding: 0;
    }

    .demo-info li {
      margin-bottom: 0.5rem;
      color: #374151;
    }
  `]
})
export class CampaignHeroDemoComponent implements OnInit {

  /** Demo campaign items for testing */
  demoItems = signal<Campaign[]>([]);

  ngOnInit(): void {
    // Create demo campaigns for testing
    this.demoItems.set([
      {
        id: 'demo-damascus-steel',
        name: 'Damascus Steel Campaign',
        type: 'product_spotlight',
        status: 'active',
        headline: {
          english: 'Authentic Damascus Steel Collection',
          arabic: 'مجموعة الفولاذ الدمشقي الأصيل'
        },
        subheadline: {
          english: 'Handcrafted by Master Artisans',
          arabic: 'صناعة يدوية من أساتذة الحرفة'
        },
        description: {
          english: 'Discover the legendary craftsmanship of Syrian Damascus steel, forged using traditional techniques passed down through generations.',
          arabic: 'اكتشف الحرفية الأسطورية للفولاذ الدمشقي السوري، المطروق بتقنيات تقليدية توارثتها الأجيال.'
        },
        heroImage: {
          url: '/assets/images/campaigns/damascus-steel-hero.svg',
          alt: {
            english: 'Damascus steel knives and blades collection',
            arabic: 'مجموعة سكاكين ونصال الفولاذ الدمشقي'
          }
        },
        cta: {
          text: {
            english: 'Shop Damascus Steel',
            arabic: 'تسوق الفولاذ الدمشقي'
          },
          color: 'syrian-red',
          variant: 'raised',
          size: 'large',
          icon: 'shopping_cart',
          iconPosition: 'left'
        },
        targetRoute: {
          type: 'category',
          target: 'damascus-steel'
        },
        schedule: {
          startDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          endDate: new Date(Date.now() + 86400000 * 30).toISOString() // 30 days from now
        },
        syrianData: {
          region: 'damascus',
          culturalContext: {
            english: 'Damascus steel represents over 1,000 years of Syrian metallurgical excellence',
            arabic: 'يمثل الفولاذ الدمشقي أكثر من 1000 عام من التميز المعدني السوري'
          },
          unescoRecognition: true,
          specialties: ['traditional-forging', 'pattern-welding', 'blade-crafting'],
          artisan: {
            name: {
              english: 'Master Ahmad Al-Shami',
              arabic: 'الأستاذ أحمد الشامي'
            },
            experience: 25,
            location: 'Damascus Old City',
            profileImage: 'https://via.placeholder.com/100x100.jpg?text=Ahmad'
          }
        }
      },
      {
        id: 'demo-aleppo-soap',
        name: 'Aleppo Soap Campaign',
        type: 'seasonal',
        status: 'active',
        headline: {
          english: 'Pure Aleppo Laurel Soap',
          arabic: 'صابون الغار الحلبي الطبيعي'
        },
        subheadline: {
          english: 'Natural Beauty from Ancient Recipes',
          arabic: 'جمال طبيعي من وصفات عريقة'
        },
        description: {
          english: 'Experience the luxury of traditional Aleppo soap, made with pure olive oil and laurel oil using centuries-old methods.',
          arabic: 'استمتع بفخامة الصابون الحلبي التقليدي، المصنوع من زيت الزيتون الخالص وزيت الغار بطرق عمرها قرون.'
        },
        heroImage: {
          url: '/assets/images/campaigns/aleppo-soap-hero.svg',
          alt: {
            english: 'Traditional Aleppo laurel soap bars',
            arabic: 'قوالب صابون الغار الحلبي التقليدي'
          }
        },
        cta: {
          text: {
            english: 'Shop Natural Soap',
            arabic: 'تسوق الصابون الطبيعي'
          },
          color: 'golden',
          variant: 'raised',
          size: 'large',
          icon: 'eco',
          iconPosition: 'left'
        },
        targetRoute: {
          type: 'category',
          target: 'beauty-wellness'
        },
        schedule: {
          startDate: new Date(Date.now() - 86400000).toISOString(),
          endDate: new Date(Date.now() + 86400000 * 45).toISOString()
        },
        syrianData: {
          region: 'aleppo',
          culturalContext: {
            english: 'Aleppo soap is a UNESCO-recognized traditional craft with 2,000 years of history',
            arabic: 'صابون حلب حرفة تقليدية معترف بها من اليونسكو بتاريخ 2000 عام'
          },
          unescoRecognition: true,
          specialties: ['laurel-oil-processing', 'traditional-saponification', 'natural-curing'],
          artisan: {
            name: {
              english: 'Master Fatima Al-Halabi',
              arabic: 'الأستاذة فاطمة الحلبي'
            },
            experience: 30,
            location: 'Aleppo Soap Quarter',
            profileImage: 'https://via.placeholder.com/100x100.jpg?text=Fatima'
          }
        }
      },
      {
        id: 'demo-textiles',
        name: 'Syrian Textiles Campaign',
        type: 'flash_sale',
        status: 'active',
        headline: {
          english: 'Exquisite Syrian Brocade',
          arabic: 'البروكار السوري الفاخر'
        },
        subheadline: {
          english: 'Limited Time Offer',
          arabic: 'عرض لفترة محدودة'
        },
        description: {
          english: 'Discover the beauty of Syrian brocade fabrics, woven with gold and silver threads in traditional patterns.',
          arabic: 'اكتشف جمال أقمشة البروكار السوري، المنسوجة بخيوط الذهب والفضة بأنماط تقليدية.'
        },
        heroImage: {
          url: '/assets/images/campaigns/syrian-textiles-hero.svg',
          alt: {
            english: 'Syrian brocade fabric with gold patterns',
            arabic: 'قماش البروكار السوري بأنماط ذهبية'
          }
        },
        cta: {
          text: {
            english: 'Shop Textiles',
            arabic: 'تسوق المنسوجات'
          },
          color: 'navy',
          variant: 'raised',
          size: 'large',
          icon: 'style',
          iconPosition: 'left'
        },
        targetRoute: {
          type: 'category',
          target: 'textiles-fabrics'
        },
        schedule: {
          startDate: new Date(Date.now() - 86400000).toISOString(),
          endDate: new Date(Date.now() + 86400000 * 7).toISOString() // 7 days
        },
        syrianData: {
          region: 'damascus',
          culturalContext: {
            english: 'Syrian brocade weaving is an ancient art form dating back to the Islamic Golden Age',
            arabic: 'نسج البروكار السوري فن عريق يعود إلى العصر الذهبي الإسلامي'
          },
          unescoRecognition: false,
          specialties: ['gold-thread-weaving', 'traditional-patterns', 'silk-processing'],
          artisan: {
            name: {
              english: 'Master Khalil Al-Dimashqi',
              arabic: 'الأستاذ خليل الدمشقي'
            },
            experience: 35,
            location: 'Damascus Straight Street',
            profileImage: 'https://via.placeholder.com/100x100.jpg?text=Khalil'
          }
        }
      }
    ]);
  }

  /**
   * Handles campaign click events
   * @param campaign - Clicked campaign
   */
  onCampaignClick(campaign: Campaign): void {
    console.log('Demo: Campaign clicked:', campaign.name);
  }

  /**
   * Handles campaign view events for analytics
   * @param campaign - Viewed campaign
   */
  onCampaignView(campaign: Campaign): void {
    console.log('Demo: Campaign viewed:', campaign.name);
  }

  /**
   * Handles navigation change events
   * @param event - Navigation change event
   */
  onNavigationChange(event: { previous: number; current: number }): void {
    console.log('Demo: Navigation changed:', event);
  }
}