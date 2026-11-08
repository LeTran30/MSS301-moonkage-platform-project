import { vendorCatalogApi } from '../api/vendorCatalogApi';

/**
 * The port between `entities/user` and `entities/vendor`.
 *
 * `entities/user` must not import `entities/vendor` directly
 * (package-architecture §3, "Tầng 4: entities" — cross-entity links go
 * through a `@x` port). Only the vendor part of the session is exposed here:
 * the Shop the signed-in account owns (FR-27).
 */
export function getMyVendorId(): Promise<string | null> {
  return vendorCatalogApi.getMyVendorId();
}
