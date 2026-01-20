/**
 * Products Store Barrel Exports
 *
 * @swagger
 * components:
 *   schemas:
 *     ProductsStoreIndex:
 *       type: object
 *       description: Products store module exports
 */

export {
  ProductsStore,
  ProductsState,
  ProductFilters,
  createInitialProductsState
} from './products.store';
export { ProductsQuery } from './products.query';
export { ProductsAkitaService } from './products-akita.service';
