/**
 * @file cart-sync.service.spec.ts
 * @description Unit tests for the CartSyncService
 *
 * TEST COVERAGE:
 * - Service creation
 * - fetchGuestCart() with success and error
 * - syncGuestCart() with success and error
 * - fetchUserCart() with success and error
 * - syncAuthenticatedCart() with success, conflict (409), and error
 * - mergeGuestCart() with success and error
 * - validateCart() with success and error
 * - addItemToCart() for guest and authenticated
 * - updateCartItem() with success and error
 * - removeCartItem() with success and error
 * - clearCart() for guest and authenticated
 * - extractProductId / extractVariantId helper functions
 */
import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { CartSyncService, ValidateCartResponse } from './cart-sync.service';
import { Cart, CartItem } from '../../shared/interfaces/cart.interface';

// =============================================================================
// HELPERS
// =============================================================================

/** Create a minimal mock Cart for testing */
function createMockCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: 'cart-1',
    items: [],
    totals: {
      subtotal: 0,
      shipping: 0,
      discount: 0,
      total: 0,
      currency: 'USD',
      itemCount: 0,
    },
    selectedCurrency: 'USD',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/** Create a minimal mock CartItem for testing */
function createMockCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'item-1',
    product: { id: 123, name: 'Test Product' } as any,
    quantity: 2,
    price: { unitPrice: 10, totalPrice: 20, shipping: 0, currency: 'USD' },
    addedAt: new Date(),
    ...overrides,
  };
}

// =============================================================================
// TEST SUITE
// =============================================================================

describe('CartSyncService', () => {
  let service: CartSyncService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        CartSyncService,
      ],
    });

    service = TestBed.inject(CartSyncService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ===========================================================================
  // SERVICE CREATION
  // ===========================================================================

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  // ===========================================================================
  // FETCH GUEST CART
  // ===========================================================================

  describe('fetchGuestCart', () => {
    it('should fetch guest cart by session ID', () => {
      const mockCart = createMockCart({ sessionId: 'guest-123' });

      service.fetchGuestCart('guest-123').subscribe(cart => {
        expect(cart).toEqual(mockCart);
      });

      const req = httpMock.expectOne(r => r.url.includes('/cart/guest/guest-123'));
      expect(req.request.method).toBe('GET');
      req.flush(mockCart);
    });

    it('should propagate errors', () => {
      service.fetchGuestCart('guest-123').subscribe({
        error: err => {
          expect(err.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(r => r.url.includes('/cart/guest/guest-123'));
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  // ===========================================================================
  // SYNC GUEST CART
  // ===========================================================================

  describe('syncGuestCart', () => {
    it('should POST guest cart items', () => {
      const items = [createMockCartItem()];
      const mockCart = createMockCart({ items });

      service.syncGuestCart('guest-123', items).subscribe(cart => {
        expect(cart).toEqual(mockCart);
      });

      const req = httpMock.expectOne(r => r.url.includes('/cart/guest'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.sessionId).toBe('guest-123');
      expect(req.request.body.items).toBeDefined();
      expect(req.request.body.timestamp).toBeDefined();
      req.flush(mockCart);
    });

    it('should propagate sync errors', () => {
      service.syncGuestCart('guest-123', []).subscribe({
        error: err => {
          expect(err.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(r => r.url.includes('/cart/guest'));
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Server Error' });
    });
  });

  // ===========================================================================
  // FETCH USER CART
  // ===========================================================================

  describe('fetchUserCart', () => {
    it('should fetch authenticated user cart', () => {
      const mockCart = createMockCart({ userId: 'user-42' });

      service.fetchUserCart('user-42').subscribe(cart => {
        expect(cart).toEqual(mockCart);
      });

      const req = httpMock.expectOne(r => r.url.includes('/cart') && !r.url.includes('/guest'));
      expect(req.request.method).toBe('GET');
      req.flush(mockCart);
    });

    it('should propagate errors', () => {
      service.fetchUserCart('user-42').subscribe({
        error: err => {
          expect(err.status).toBe(401);
        },
      });

      const req = httpMock.expectOne(r => r.url.includes('/cart'));
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  // ===========================================================================
  // SYNC AUTHENTICATED CART
  // ===========================================================================

  describe('syncAuthenticatedCart', () => {
    it('should POST cart sync with correct payload format', () => {
      const items = [createMockCartItem({ product: { id: 42, name: 'Widget' } as any })];
      const cart = createMockCart({ items, version: 5 });
      const responseCart = createMockCart({ version: 6 });

      service.syncAuthenticatedCart('user-1', cart).subscribe(result => {
        expect(result.version).toBe(6);
      });

      const req = httpMock.expectOne(r => r.url.includes('/cart/sync'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.clientVersion).toBe(5);
      expect(req.request.body.items[0].productId).toBe(42);
      expect(req.request.body.clientTimestamp).toBeDefined();
      req.flush(responseCart);
    });

    it('should handle items with string product IDs', () => {
      const items = [createMockCartItem({
        product: { id: '99', name: 'StringIdProduct' } as any,
        selectedVariant: { id: '7' } as any,
      })];
      const cart = createMockCart({ items, version: 1 });

      service.syncAuthenticatedCart('user-1', cart).subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/cart/sync'));
      expect(req.request.body.items[0].productId).toBe(99);
      expect(req.request.body.items[0].variantId).toBe(7);
      req.flush(createMockCart());
    });

    it('should handle items without variant', () => {
      const items = [createMockCartItem({ selectedVariant: undefined })];
      const cart = createMockCart({ items, version: 1 });

      service.syncAuthenticatedCart('user-1', cart).subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/cart/sync'));
      expect(req.request.body.items[0].variantId).toBeUndefined();
      req.flush(createMockCart());
    });

    it('should propagate 409 conflict errors', () => {
      const cart = createMockCart({ version: 3 });

      service.syncAuthenticatedCart('user-1', cart).subscribe({
        error: err => {
          expect(err.status).toBe(409);
        },
      });

      const req = httpMock.expectOne(r => r.url.includes('/cart/sync'));
      req.flush({ message: 'Conflict' }, { status: 409, statusText: 'Conflict' });
    });

    it('should propagate server errors', () => {
      const cart = createMockCart();

      service.syncAuthenticatedCart('user-1', cart).subscribe({
        error: err => {
          expect(err.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(r => r.url.includes('/cart/sync'));
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });
    });
  });

  // ===========================================================================
  // MERGE GUEST CART
  // ===========================================================================

  describe('mergeGuestCart', () => {
    it('should merge guest cart into authenticated cart', () => {
      const mergedCart = createMockCart({ items: [createMockCartItem()] });

      service.mergeGuestCart('user-1', 'guest-123').subscribe(cart => {
        expect(cart.items.length).toBe(1);
      });

      const req = httpMock.expectOne(r => r.url.includes('/cart/merge'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.guestSessionId).toBe('guest-123');
      req.flush(mergedCart);
    });

    it('should propagate merge errors', () => {
      service.mergeGuestCart('user-1', 'guest-123').subscribe({
        error: err => {
          expect(err.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(r => r.url.includes('/cart/merge'));
      req.flush({ message: 'Bad request' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  // ===========================================================================
  // VALIDATE CART
  // ===========================================================================

  describe('validateCart', () => {
    it('should validate cart and return validation result', () => {
      const cart = createMockCart({ items: [createMockCartItem()] });
      const validationResult: ValidateCartResponse = {
        isValid: true,
        warnings: [],
        errors: [],
      };

      service.validateCart(cart).subscribe(result => {
        expect(result.isValid).toBeTrue();
      });

      const req = httpMock.expectOne(r => r.url.includes('/cart/validate'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.items).toBeDefined();
      expect(req.request.body.timestamp).toBeDefined();
      req.flush(validationResult);
    });

    it('should propagate validation errors', () => {
      const cart = createMockCart();

      service.validateCart(cart).subscribe({
        error: err => {
          expect(err.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(r => r.url.includes('/cart/validate'));
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });
    });
  });

  // ===========================================================================
  // ADD ITEM TO CART
  // ===========================================================================

  describe('addItemToCart', () => {
    it('should POST to guest endpoint when sessionId provided', () => {
      const mockCart = createMockCart();

      service.addItemToCart('prod-1', 2, 'guest-123').subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/cart/guest'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.productId).toBe('prod-1');
      expect(req.request.body.quantity).toBe(2);
      expect(req.request.body.sessionId).toBe('guest-123');
      req.flush(mockCart);
    });

    it('should POST to item endpoint for authenticated user', () => {
      const mockCart = createMockCart();

      service.addItemToCart('prod-1', 1).subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/cart/item'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.productId).toBe('prod-1');
      req.flush(mockCart);
    });

    it('should propagate errors', () => {
      service.addItemToCart('prod-1', 1).subscribe({
        error: err => expect(err.status).toBe(400),
      });

      const req = httpMock.expectOne(r => r.url.includes('/cart/item'));
      req.flush({ message: 'Bad request' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  // ===========================================================================
  // UPDATE CART ITEM
  // ===========================================================================

  describe('updateCartItem', () => {
    it('should PUT updated quantity', () => {
      const mockCart = createMockCart();

      service.updateCartItem('item-1', 5).subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/cart/item/item-1'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.quantity).toBe(5);
      req.flush(mockCart);
    });

    it('should propagate errors', () => {
      service.updateCartItem('item-1', 5).subscribe({
        error: err => expect(err.status).toBe(404),
      });

      const req = httpMock.expectOne(r => r.url.includes('/cart/item/item-1'));
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  // ===========================================================================
  // REMOVE CART ITEM
  // ===========================================================================

  describe('removeCartItem', () => {
    it('should DELETE cart item', () => {
      const mockCart = createMockCart();

      service.removeCartItem('item-1').subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/cart/item/item-1'));
      expect(req.request.method).toBe('DELETE');
      req.flush(mockCart);
    });

    it('should propagate errors', () => {
      service.removeCartItem('item-1').subscribe({
        error: err => expect(err.status).toBe(404),
      });

      const req = httpMock.expectOne(r => r.url.includes('/cart/item/item-1'));
      req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  // ===========================================================================
  // CLEAR CART
  // ===========================================================================

  describe('clearCart', () => {
    it('should DELETE guest cart when sessionId provided', () => {
      const mockCart = createMockCart();

      service.clearCart('guest-123').subscribe();

      const req = httpMock.expectOne(r => r.url.includes('/cart/guest/guest-123'));
      expect(req.request.method).toBe('DELETE');
      req.flush(mockCart);
    });

    it('should DELETE authenticated cart when no sessionId', () => {
      const mockCart = createMockCart();

      service.clearCart().subscribe();

      const req = httpMock.expectOne(r =>
        r.url.includes('/cart') && !r.url.includes('/guest') && !r.url.includes('/item'),
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(mockCart);
    });

    it('should propagate errors', () => {
      service.clearCart().subscribe({
        error: err => expect(err.status).toBe(500),
      });

      const req = httpMock.expectOne(r => r.url.includes('/cart'));
      req.flush({ message: 'Error' }, { status: 500, statusText: 'Server Error' });
    });
  });
});
