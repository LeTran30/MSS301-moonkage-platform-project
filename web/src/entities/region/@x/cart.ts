/**
 * The port between `entities/region` and `entities/cart`.
 *
 * `entities/cart` must not import `entities/region` directly
 * (package-architecture §3, "Tầng 4: entities" — cross-entity links go
 * through a `@x` port). Only the delivery province is exposed here: the
 * backend prices the cart and its delivery fee for that province (BR-30).
 */
export { useDeliveryProvinceCode } from '../model/deliveryProvince';
