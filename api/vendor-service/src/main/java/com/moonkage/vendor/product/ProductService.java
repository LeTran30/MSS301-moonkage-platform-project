package com.moonkage.vendor.product;

import com.moonkage.vendor.product.dto.request.ProductImageUploadRequest;
import com.moonkage.vendor.product.dto.request.SaveProductRequest;
import com.moonkage.vendor.product.dto.request.UpdateProductRequest;
import com.moonkage.vendor.product.dto.response.ProductResponse;
import com.moonkage.vendor.security.CurrentUserInfo;
import com.moonkage.vendor.vendor.dto.response.PresignedUploadLinkResponse;
import java.util.List;

/**
 * The write side of a Shop's products (FR-29 to FR-34, FR-46; L-18). Buyers read products from catalog-service,
 * which copies them from the events written here.
 *
 * <p>A Shop writes when it is its vendor's owner, the vendor may operate (approved, registration fee paid, not
 * locked: BR-20, BR-31) and sells in the Shop (BR-21). An admin only removes.
 */
public interface ProductService {

    /** Step 1 of FR-29 image upload; send the tempKey among imageKeys to save it. */
    PresignedUploadLinkResponse createImageUploadLink(
            CurrentUserInfo caller, String vendorId, ProductImageUploadRequest request);

    /** FR-29: on sale at once (BR-24). */
    ProductResponse createProduct(CurrentUserInfo caller, String vendorId, SaveProductRequest request);

    /** The Shop's products, every status, newest first. Owner or admin. */
    List<ProductResponse> getProducts(CurrentUserInfo caller, String vendorId);

    /** Owner or admin. */
    ProductResponse getProduct(CurrentUserInfo caller, String vendorId, String productId);

    /**
     * FR-30, FR-32, FR-33: the whole product again. PRODUCT_CHANGED when {@code request.version()} is not the
     * current one, so an edit never overwrites one it did not see.
     */
    ProductResponse replaceProduct(
            CurrentUserInfo caller, String vendorId, String productId, SaveProductRequest request);

    /** FR-34 (owner: ON_SALE, HIDDEN) and FR-46 (admin: REMOVED with a reason). */
    ProductResponse updateProduct(
            CurrentUserInfo caller, String vendorId, String productId, UpdateProductRequest request);
}
