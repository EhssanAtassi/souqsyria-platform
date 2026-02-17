/**
 * @file review.service.spec.ts
 * @description Unit tests for ReviewService
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReviewService } from './review.service';
import { environment } from '../../../../environments/environment';

describe('ReviewService', () => {
  let service: ReviewService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReviewService],
    });

    service = TestBed.inject(ReviewService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch reviews', () => {
    const mockResponse = {
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    };

    service.getReviews('test-product', 1, 10, 'newest').subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(
      `${environment.productApiUrl}/test-product/reviews?page=1&limit=10&sortBy=newest`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch review summary', () => {
    const mockSummary = {
      averageRating: 4.5,
      totalReviews: 10,
      distribution: { 1: 0, 2: 0, 3: 1, 4: 4, 5: 5 },
    };

    service.getReviewSummary('test-product').subscribe((summary) => {
      expect(summary).toEqual(mockSummary);
    });

    const req = httpMock.expectOne(
      `${environment.productApiUrl}/test-product/reviews/summary`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockSummary);
  });

  it('should submit review', () => {
    const mockReview = {
      rating: 5,
      titleEn: 'Great',
      bodyEn: 'Excellent product',
    };

    service.submitReview('test-product', mockReview).subscribe();

    const req = httpMock.expectOne(
      `${environment.productApiUrl}/test-product/reviews`
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockReview);
    req.flush({});
  });

  it('should mark review as helpful', () => {
    service.markHelpful(123).subscribe();

    const req = httpMock.expectOne(
      `${environment.productApiUrl}/reviews/123/helpful`
    );
    expect(req.request.method).toBe('POST');
    req.flush({ helpfulCount: 5 });
  });
});
