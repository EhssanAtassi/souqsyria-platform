/**
 * @file review-list.component.spec.ts
 * @description Unit tests for ReviewListComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewListComponent } from './review-list.component';
import { ReviewService } from '../../services/review.service';
import { of } from 'rxjs';

describe('ReviewListComponent', () => {
  let component: ReviewListComponent;
  let fixture: ComponentFixture<ReviewListComponent>;
  let mockReviewService: jasmine.SpyObj<ReviewService>;

  beforeEach(async () => {
    mockReviewService = jasmine.createSpyObj('ReviewService', [
      'getReviews',
      'markHelpful',
    ]);

    mockReviewService.getReviews.and.returnValue(
      of({
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      })
    );

    await TestBed.configureTestingModule({
      imports: [ReviewListComponent],
      providers: [{ provide: ReviewService, useValue: mockReviewService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('slug', 'test-product');
    fixture.componentRef.setInput('language', 'en');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load reviews on init', () => {
    expect(mockReviewService.getReviews).toHaveBeenCalledWith(
      'test-product',
      1,
      10,
      'newest'
    );
  });
});
