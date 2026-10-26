package com.moonkage.vendor.product;

import com.moonkage.storage.BucketAccess;
import com.moonkage.storage.ObjectStorage;
import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * The image files of products in the public bucket. A file follows its database row: a new upload is moved in
 * before the row is written and deleted again if the transaction rolls back; a file the product no longer lists is
 * deleted once the transaction commits. The bucket never keeps a file no product lists, the product never lists a
 * missing file.
 */
@Component
@RequiredArgsConstructor
class ProductImages {

    private final ObjectStorage objectStorage;
    private final ProductImageProperties properties;

    /**
     * Gives each key its final key, in the same order: a key the product has stays, a new upload is checked and
     * moved under the vendor's prefix. Must run in the transaction that saves the product.
     *
     * @param current the keys the product has now; empty for a new product
     * @throws AppException PRODUCT_IMAGE_INVALID for a key that is neither
     */
    List<String> place(String vendorId, List<String> keys, Collection<String> current) {
        Set<String> kept = new HashSet<>(current);
        for (String key : keys) {
            if (!kept.contains(key) && !objectStorage.isTempKey(key)) {
                throw new AppException(ErrorCode.PRODUCT_IMAGE_INVALID, key).atField(ProductDetails.IMAGE_KEYS);
            }
        }
        List<String> moved = new ArrayList<>();
        deleteOnRollback(moved);
        List<String> placed = new ArrayList<>(keys.size());
        for (String key : keys) {
            if (kept.contains(key)) {
                placed.add(key);
            } else {
                String finalKey = objectStorage.moveUploadedFile(
                        key, properties.toFileLimit(), BucketAccess.PUBLIC, properties.keyPrefixOf(vendorId));
                moved.add(finalKey);
                placed.add(finalKey);
            }
        }
        deleteOnCommit(current.stream().filter(key -> !placed.contains(key)).toList());
        return placed;
    }

    String urlOf(String key) {
        return objectStorage.toPublicUrl(key);
    }

    private void deleteOnRollback(List<String> keys) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    delete(keys);
                }
            }
        });
    }

    private void deleteOnCommit(List<String> keys) {
        if (keys.isEmpty()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                delete(keys);
            }
        });
    }

    private void delete(List<String> keys) {
        keys.forEach(key -> objectStorage.deleteQuietly(BucketAccess.PUBLIC, key));
    }
}
