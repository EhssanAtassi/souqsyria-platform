import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartQuery } from '../../../store/cart/cart.query';
import { ProductsQuery } from '../../../store/products/products.query';
import { LanguageService } from '../../../shared/services/language.service';

/**
 * Checkout Stock Validation Guard (SS-CART-007)
 *
 * @description Prevents navigation to checkout if any cart items are out of stock.
 * Checks each cart item's product against the ProductsQuery for current stock status.
 * If OOS items are found, shows a snackbar warning and redirects to /cart.
 *
 * @swagger
 * components:
 *   schemas:
 *     CheckoutStockGuard:
 *       type: object
 *       description: Route guard that validates cart stock before checkout
 *
 * @returns true if all cart items are in stock, UrlTree to /cart otherwise
 */
export const checkoutStockGuard: CanActivateFn = () => {
  const cartQuery = inject(CartQuery);
  const productsQuery = inject(ProductsQuery);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  const languageService = inject(LanguageService);

  const cart = cartQuery.getValue();

  if (cart.items.length === 0) {
    return router.createUrlTree(['/cart']);
  }

  const oosItems = cart.items.filter(item => {
    const product = productsQuery.getEntity(item.product.id);
    return !product || !product.inventory?.inStock || (product.inventory?.quantity ?? 0) <= 0;
  });

  if (oosItems.length > 0) {
    const lang = languageService.language();
    const message = lang === 'ar'
      ? `${oosItems.length} منتج(ات) غير متوفر. يرجى تحديث سلتك.`
      : `${oosItems.length} item(s) are out of stock. Please update your cart.`;

    snackBar.open(message, lang === 'ar' ? 'إغلاق' : 'Close', {
      duration: 5000,
      panelClass: 'error-snackbar',
    });

    return router.createUrlTree(['/cart'], {
      queryParams: { reason: 'stock-unavailable' }
    });
  }

  return true;
};
