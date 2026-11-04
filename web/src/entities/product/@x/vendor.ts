/**
 * The port between `entities/product` and `entities/vendor`.
 *
 * `entities/vendor` must not import `entities/product` directly
 * (package-architecture §3, "Tầng 4: entities" — cross-entity links go through
 * a `@x` port that only exports types).
 */
export type {
  Product,
  ProductStatus,
  CakeCrust,
  CakeFilling,
} from '../model/types';
