package com.moonkage.catalog.service.impl;

import com.moonkage.catalog.dto.request.ProductSnapshotRequest;
import com.moonkage.catalog.dto.response.ProductSnapshotResponse;
import com.moonkage.catalog.dto.response.ProductSnapshotResponse.ProductPart;
import com.moonkage.catalog.dto.response.ProductSnapshotResponse.VendorPart;
import com.moonkage.catalog.entity.InterprovinceFee;
import com.moonkage.catalog.entity.readmodel.ProductListing;
import com.moonkage.catalog.enums.DeliveryLabel;
import com.moonkage.catalog.enums.ProductStatus;
import com.moonkage.catalog.repository.InterprovinceFeeRepository;
import com.moonkage.catalog.repository.readmodel.ProductListingRepository;
import com.moonkage.catalog.service.ProductSnapshotService;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("!legacy-writer")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductSnapshotServiceImpl implements ProductSnapshotService {

    private final ProductListingRepository listingRepository;
    private final InterprovinceFeeRepository feeRepository;

    @Override
    public ProductSnapshotResponse snapshot(ProductSnapshotRequest request) {
        List<ProductListing> listings = request.productIds().stream()
                .distinct()
                .map(listingRepository::findById)
                .flatMap(Optional::stream)
                .toList();
        Map<String, List<ProductListing>> byVendor = new LinkedHashMap<>();
        listings.forEach(listing -> byVendor.computeIfAbsent(listing.getVendorId(), id -> new ArrayList<>())
                .add(listing));
        Long interprovinceFee = feeRepository.findFees().stream()
                .filter(fee -> fee.provinceCode().equals(request.provinceCode()))
                .map(InterprovinceFee::fee)
                .findFirst()
                .orElse(null);

        List<ProductPart> products =
                listings.stream().map(ProductSnapshotServiceImpl::toProduct).toList();
        List<VendorPart> vendors = byVendor.values().stream()
                .map(vendorListings -> toVendor(vendorListings, request.provinceCode(), interprovinceFee))
                .toList();
        return new ProductSnapshotResponse(products, vendors);
    }

    /**
     * BR-30: inside the vendor's areas its local fee; outside them only nationwide products go, at the province's
     * interprovince fee.
     */
    private static VendorPart toVendor(List<ProductListing> listings, String provinceCode, Long interprovinceFee) {
        ProductListing any = listings.getFirst();
        String[] areas = any.getDeliveryAreas() == null ? new String[0] : any.getDeliveryAreas();
        if (Arrays.asList(areas).contains(provinceCode)) {
            Long fee = any.getLocalDeliveryFee();
            return new VendorPart(any.getVendorId(), any.getVendorName(), fee != null, false, fee);
        }
        boolean allNationwide =
                listings.stream().allMatch(listing -> listing.getDeliveryLabel() == DeliveryLabel.NATIONWIDE);
        boolean deliverable = allNationwide && interprovinceFee != null;
        return new VendorPart(
                any.getVendorId(), any.getVendorName(), deliverable, true, deliverable ? interprovinceFee : null);
    }

    private static ProductPart toProduct(ProductListing listing) {
        boolean purchasable =
                listing.getStatus() == ProductStatus.ON_SALE && listing.isCanOperate() && listing.isSellsShop();
        return new ProductPart(
                listing.getProductId(),
                listing.getVendorId(),
                listing.getOwnerAccountId(),
                listing.getName(),
                listing.getListPrice(),
                listing.getStock(),
                listing.getQuoteThreshold(),
                listing.getDeliveryLabel(),
                purchasable);
    }
}
