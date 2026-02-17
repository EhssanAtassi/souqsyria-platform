/**
 * @file review-form.component.spec.ts
 * @description Unit tests for ReviewFormComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewFormComponent } from './review-form.component';
import { ReviewService } from '../../services/review.service';
import { of } from 'rxjs';

describe('ReviewFormComponent', () => {
  let component: ReviewFormComponent;
  let fixture: ComponentFixture<ReviewFormComponent>;
  let mockReviewService: jasmine.SpyObj<ReviewService>;

  beforeEach(async () => {
    mockReviewService = jasmine.createSpyObj('ReviewService', ['submitReview']);

    mockReviewService.submitReview.and.returnValue(
      of({
        id: 1,
        rating: 5,
        titleEn: 'Great product',
        bodyEn: 'Very satisfied',
        isVerifiedPurchase: false,
        helpfulCount: 0,
        createdAt: new Date().toISOString(),
        user: {
          id: 1,
          fullName: 'Test User',
        },
      })
    );

    await TestBed.configureTestingModule({
      imports: [ReviewFormComponent],
      providers: [{ provide: ReviewService, useValue: mockReviewService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('slug', 'test-product');
    fixture.componentRef.setInput('language', 'en');
    fixture.componentRef.setInput('isAuthenticated', true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set rating when star is clicked', () => {
    component.setRating(4);
    expect(component.selectedRating()).toBe(4);
  });

  it('should add pro to list', () => {
    component.newPro.set('Great quality');
    component.addPro();
    expect(component.pros()).toContain('Great quality');
    expect(component.newPro()).toBe('');
  });
});
