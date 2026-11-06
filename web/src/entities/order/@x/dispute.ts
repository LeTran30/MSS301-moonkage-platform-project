/**
 * The port between `entities/order` and `entities/dispute`.
 *
 * `entities/dispute` must not import `entities/order` directly
 * (package-architecture §3, "Tầng 4: entities" — cross-entity links go through
 * a `@x` port that only exports what the other side needs).
 */
export { orderApi } from '../api/orderApi';
