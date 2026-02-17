/**
 * @file review-summary.component.spec.ts
 * @description Unit tests for ReviewSummaryComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewSummaryComponent } from './review-summary.component';
import { ReviewSummary } from '../../models/review.interface';

describe('ReviewSummaryComponent', () => {
  let component: ReviewSummaryComponent;
  let fixture: ComponentFixture<ReviewSummaryComponent>;

  const mockReviewSummary: ReviewSummary = {
    averageRating: 4.3,
    totalReviews: 25,
    distribution: {
      1: 1,
      2: 2,
      3: 4,
      4: 8,
      5: 10,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewSummaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewSummaryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('summary', mockReviewSummary);
    fixture.componentRef.setInput('language', 'en');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display average rating', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('4.3');
  });

  it('should compute star icons correctly', () => {
    const icons = component.starIcons();
    expect(icons).toEqual(['star', 'star', 'star', 'star', 'star_border']);
  });
});
