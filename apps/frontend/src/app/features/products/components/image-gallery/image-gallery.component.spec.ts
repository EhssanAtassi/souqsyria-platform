/**
 * @file image-gallery.component.spec.ts
 * @description Unit tests for ImageGalleryComponent (SS-PROD-008)
 * Tests rendering, thumbnail clicks, selectedIndex, skeleton, RTL, and empty state
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ImageGalleryComponent } from './image-gallery.component';
import { ProductDetailImage } from '../../models/product-detail.interface';

/** Creates a mock ProductDetailImage */
function createMockImage(overrides: Partial<ProductDetailImage> = {}): ProductDetailImage {
  return {
    id: 1,
    imageUrl: 'https://example.com/image-1.jpg',
    altText: 'Test Image',
    sortOrder: 0,
    ...overrides,
  };
}

describe('ImageGalleryComponent', () => {
  let component: ImageGalleryComponent;
  let fixture: ComponentFixture<ImageGalleryComponent>;

  const defaultImages: ProductDetailImage[] = [
    createMockImage({ id: 1, imageUrl: 'https://example.com/1.jpg', sortOrder: 0 }),
    createMockImage({ id: 2, imageUrl: 'https://example.com/2.jpg', sortOrder: 1 }),
    createMockImage({ id: 3, imageUrl: 'https://example.com/3.jpg', sortOrder: 2 }),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageGalleryComponent],
      providers: [provideNoopAnimations()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageGalleryComponent);
    component = fixture.componentInstance;
  });

  function setInputs(
    images: ProductDetailImage[] = defaultImages,
    options?: { language?: 'en' | 'ar'; selectedIndex?: number; productName?: string }
  ): void {
    fixture.componentRef.setInput('images', images);
    if (options?.language) {
      fixture.componentRef.setInput('language', options.language);
    }
    if (options?.selectedIndex !== undefined) {
      fixture.componentRef.setInput('selectedIndex', options.selectedIndex);
    }
    if (options?.productName) {
      fixture.componentRef.setInput('productName', options.productName);
    }
    fixture.detectChanges();
  }

  it('should create', () => {
    setInputs();
    expect(component).toBeTruthy();
  });

  describe('Rendering', () => {
    it('should render main image on desktop', () => {
      setInputs();
      const el: HTMLElement = fixture.nativeElement;
      const mainImg = el.querySelector('.image-gallery__main-image');
      expect(mainImg).toBeTruthy();
      expect((mainImg as HTMLImageElement).src).toContain('1.jpg');
    });

    it('should render thumbnails for multiple images', () => {
      setInputs();
      const el: HTMLElement = fixture.nativeElement;
      const thumbnails = el.querySelectorAll('.image-gallery__thumbnail');
      expect(thumbnails.length).toBe(3);
    });

    it('should not render thumbnails for single image', () => {
      setInputs([createMockImage()]);
      const el: HTMLElement = fixture.nativeElement;
      const thumbnails = el.querySelectorAll('.image-gallery__thumbnail');
      expect(thumbnails.length).toBe(0);
    });
  });

  describe('Thumbnail Click', () => {
    it('should update currentIndex on thumbnail click', () => {
      setInputs();
      component.selectThumbnail(2);
      expect(component.currentIndex()).toBe(2);
    });

    it('should emit imageChange on thumbnail click', () => {
      setInputs();
      spyOn(component.imageChange, 'emit');
      component.selectThumbnail(1);
      expect(component.imageChange.emit).toHaveBeenCalledWith(1);
    });

    it('should update main image after thumbnail click', () => {
      setInputs();
      component.selectThumbnail(1);
      fixture.detectChanges();

      expect(component.currentImage()?.imageUrl).toContain('2.jpg');
    });

    it('should apply active class to selected thumbnail', () => {
      setInputs();
      component.selectThumbnail(1);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const activeThumbs = el.querySelectorAll('.image-gallery__thumbnail--active');
      expect(activeThumbs.length).toBe(1);
    });
  });

  describe('selectedIndex Input', () => {
    it('should set currentIndex from selectedIndex input', async () => {
      setInputs(defaultImages, { selectedIndex: 2 });
      // Allow effect to run
      await fixture.whenStable();
      fixture.detectChanges();
      expect(component.currentIndex()).toBe(2);
    });

    it('should update displayed image when selectedIndex changes', async () => {
      setInputs(defaultImages, { selectedIndex: 0 });
      await fixture.whenStable();
      fixture.detectChanges();
      expect(component.currentImage()?.imageUrl).toContain('1.jpg');

      fixture.componentRef.setInput('selectedIndex', 2);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(component.currentImage()?.imageUrl).toContain('3.jpg');
    });
  });

  describe('Skeleton Loading', () => {
    it('should show skeleton before image loads', () => {
      setInputs();
      const el: HTMLElement = fixture.nativeElement;
      const skeleton = el.querySelector('.image-gallery__skeleton');
      expect(skeleton).toBeTruthy();
    });

    it('should hide skeleton after image loads', () => {
      setInputs();
      component.onImageLoad(0);
      fixture.detectChanges();

      expect(component.isImageLoaded(0)).toBeTrue();
    });
  });

  describe('RTL Support', () => {
    it('should apply rtl class when language is ar', () => {
      setInputs(defaultImages, { language: 'ar' });
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.image-gallery.rtl')).toBeTruthy();
    });

    it('should set dir=rtl on thumbnail container when language is ar', () => {
      setInputs(defaultImages, { language: 'ar' });
      const el: HTMLElement = fixture.nativeElement;
      const thumbs = el.querySelector('.image-gallery__thumbnails');
      expect(thumbs?.getAttribute('dir')).toBe('rtl');
    });
  });

  describe('Empty State', () => {
    it('should render empty state for no images', () => {
      setInputs([]);
      const el: HTMLElement = fixture.nativeElement;
      const empty = el.querySelector('.image-gallery__empty');
      expect(empty).toBeTruthy();
    });

    it('should not render gallery when images are empty', () => {
      setInputs([]);
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.image-gallery__desktop')).toBeFalsy();
      expect(el.querySelector('.image-gallery__mobile')).toBeFalsy();
    });
  });

  describe('Zoom', () => {
    it('should activate zoom on mouse enter', () => {
      setInputs();
      component.onMainImageMouseEnter();
      expect(component.isZoomActive()).toBeTrue();
    });

    it('should deactivate zoom on mouse leave', () => {
      setInputs();
      component.onMainImageMouseEnter();
      component.onMainImageMouseLeave();
      expect(component.isZoomActive()).toBeFalse();
    });
  });

  describe('Fullscreen', () => {
    it('should open fullscreen overlay', () => {
      setInputs();
      component.openFullscreen();
      expect(component.isFullscreenOpen()).toBeTrue();
    });

    it('should close fullscreen overlay', () => {
      setInputs();
      component.openFullscreen();
      component.closeFullscreen();
      expect(component.isFullscreenOpen()).toBeFalse();
    });
  });
});
