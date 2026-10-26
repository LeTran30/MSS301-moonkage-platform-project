package com.moonkage.vendor.vendor;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.security.CurrentUserInfo;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Loads a vendor for the services of the Vendor aggregate, with who may see or change it. */
@Component
@RequiredArgsConstructor
class VendorFinder {

    private final VendorRepository vendorRepository;
    private final EntityManager entityManager;

    Vendor get(String vendorId) {
        return vendorRepository.findById(vendorId).orElseThrow(VendorFinder::notFound);
    }

    /** Locked and with a new version, for a change that ends with a snapshot (vendor.updated). */
    Vendor getForChange(String vendorId) {
        return findForChange(vendorId).orElseThrow(VendorFinder::notFound);
    }

    /**
     * The vendor about to change, its row locked and its version raised at once. Every change of the aggregate,
     * delivery areas and order profile included, so gets a new version for its snapshot, and two changes of one
     * vendor never announce out of order. The lock goes on the managed entity: a vendor already loaded in this
     * transaction would come back from a locking query without its version raised.
     */
    Optional<Vendor> findForChange(String vendorId) {
        return vendorRepository.findById(vendorId).map(vendor -> {
            entityManager.lock(vendor, LockModeType.PESSIMISTIC_FORCE_INCREMENT);
            return vendor;
        });
    }

    /** Its owner or an admin. */
    Vendor getVisibleTo(CurrentUserInfo caller, String vendorId) {
        Vendor vendor = get(vendorId);
        if (!caller.isAdmin() && !vendor.isOwnedBy(caller.accountId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        return vendor;
    }

    /** Its owner only, for a change of the selling settings (FR-28, FR-35). */
    Vendor getForOwnerChange(CurrentUserInfo caller, String vendorId) {
        if (!get(vendorId).isOwnedBy(caller.accountId())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
        return getForChange(vendorId);
    }

    private static AppException notFound() {
        return new AppException(ErrorCode.VENDOR_NOT_FOUND);
    }
}
