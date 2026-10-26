package com.moonkage.vendor.vendor;

import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.PriceTier;
import com.moonkage.vendor.common.vo.PriceTiers;
import com.moonkage.vendor.common.vo.Quantity;
import com.moonkage.vendor.security.CurrentUserInfo;
import com.moonkage.vendor.vendor.dto.request.SaveOrderProfileRequest;
import com.moonkage.vendor.vendor.dto.response.OrderProfileResponse;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.function.Supplier;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
class OrderProfileServiceImpl implements OrderProfileService {

    private static final String FIELD_MIN_QTY = "minQty";
    private static final String FIELD_PRICE_TIERS = "priceTiers";
    private static final String FIELD_WEEKLY_CAPACITY = "weeklyCapacity";
    private static final String FIELD_PACKAGING_TYPES = "packagingTypes";
    private static final String FIELD_LOGO_PRINTING = "logoPrinting";
    private static final String FIELD_DISTRIBUTED_BRANDS = "distributedBrands";
    private static final String FIELD_GATHERABLE_QTY = "gatherableQty";

    private final VendorFinder vendorFinder;
    private final OrderProfileRepository orderProfileRepository;
    private final VendorSnapshotPublisher snapshotPublisher;

    @Override
    @Transactional(readOnly = true)
    public OrderProfileResponse getOrderProfile(CurrentUserInfo caller, String vendorId) {
        vendorFinder.getVisibleTo(caller, vendorId);
        return orderProfileRepository
                .findByVendorId(vendorId)
                .map(OrderProfileServiceImpl::toResponse)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_PROFILE_NOT_FOUND));
    }

    @Override
    @Transactional
    public OrderProfileResponse saveOrderProfile(
            CurrentUserInfo caller, String vendorId, SaveOrderProfileRequest request) {
        Vendor vendor = vendorFinder.getForOwnerChange(caller, vendorId);
        vendor.checkSellingSettingsEditable();
        if (!vendor.isAcceptsOrders()) {
            throw new AppException(ErrorCode.VENDOR_NOT_ACCEPTING_ORDERS);
        }
        OrderTerms terms = toTerms(request, vendor.getSupplySource());

        OrderProfile profile = orderProfileRepository
                .findByVendorId(vendorId)
                .map(existing -> {
                    existing.replace(terms);
                    return existing;
                })
                .orElseGet(() -> orderProfileRepository.save(OrderProfile.of(vendorId, terms)));
        snapshotPublisher.announceUpdated(vendor, caller.accountId());
        return toResponse(profile);
    }

    /** AC-35.1 for every vendor, AC-35.2 when it produces, AC-35.3 when it resells. */
    private static OrderTerms toTerms(SaveOrderProfileRequest request, SupplySource supplySource) {
        Quantity minQty = atField(FIELD_MIN_QTY, () -> Quantity.of(request.minQty()));
        PriceTiers priceTiers = atField(
                FIELD_PRICE_TIERS,
                () -> PriceTiers.of(request.priceTiers().stream()
                        .map(tier -> PriceTier.of(tier.fromQty(), tier.unitPrice()))
                        .toList()));
        boolean produces = supplySource != SupplySource.RESELL;
        boolean resells = supplySource != SupplySource.SELF_PRODUCED;
        Quantity weeklyCapacity =
                optionalQuantity(FIELD_WEEKLY_CAPACITY, request.weeklyCapacity(), produces, supplySource);
        Quantity gatherableQty = optionalQuantity(FIELD_GATHERABLE_QTY, request.gatherableQty(), resells, supplySource);
        if (produces) {
            requireText(FIELD_PACKAGING_TYPES, request.packagingTypes(), supplySource);
            if (request.logoPrinting() == null) {
                throw termRequired(FIELD_LOGO_PRINTING, supplySource);
            }
        }
        if (resells) {
            requireText(FIELD_DISTRIBUTED_BRANDS, request.distributedBrands(), supplySource);
        }
        Set<CustomType> customTypes =
                request.customTypes() == null || request.customTypes().isEmpty()
                        ? EnumSet.noneOf(CustomType.class)
                        : EnumSet.copyOf(request.customTypes());
        return new OrderTerms(
                minQty,
                request.leadTimeDays(),
                priceTiers,
                customTypes,
                trimToNull(request.earlyBirdOffer()),
                weeklyCapacity,
                produces ? request.packagingTypes().trim() : trimToNull(request.packagingTypes()),
                request.logoPrinting(),
                resells ? request.distributedBrands().trim() : trimToNull(request.distributedBrands()),
                gatherableQty);
    }

    /** Required when {@code required}; when sent anyway it must still be a quantity. */
    private static Quantity optionalQuantity(String field, Integer value, boolean required, SupplySource supplySource) {
        if (value == null) {
            if (required) {
                throw termRequired(field, supplySource);
            }
            return null;
        }
        return atField(field, () -> Quantity.of(value));
    }

    private static void requireText(String field, String value, SupplySource supplySource) {
        if (!StringUtils.hasText(value)) {
            throw termRequired(field, supplySource);
        }
    }

    private static AppException termRequired(String field, SupplySource supplySource) {
        return new AppException(ErrorCode.ORDER_TERM_REQUIRED, supplySource.name()).atField(field);
    }

    private static String trimToNull(String text) {
        return StringUtils.hasText(text) ? text.trim() : null;
    }

    private static <T> T atField(String field, Supplier<T> valueObject) {
        try {
            return valueObject.get();
        } catch (AppException e) {
            throw e.atField(field);
        }
    }

    private static OrderProfileResponse toResponse(OrderProfile profile) {
        List<OrderProfileResponse.PriceTier> tiers = profile.toPriceTiers().tiers().stream()
                .map(tier -> new OrderProfileResponse.PriceTier(
                        tier.fromQty().value(), tier.unitPrice().value()))
                .toList();
        return new OrderProfileResponse(
                profile.getMinQty().value(),
                profile.getLeadTimeDays(),
                tiers,
                Set.copyOf(profile.getCustomTypes()),
                profile.getEarlyBirdOffer(),
                profile.getWeeklyCapacity() == null
                        ? null
                        : profile.getWeeklyCapacity().value(),
                profile.getPackagingTypes(),
                profile.getLogoPrinting(),
                profile.getDistributedBrands(),
                profile.getGatherableQty() == null
                        ? null
                        : profile.getGatherableQty().value(),
                profile.getUpdatedAt());
    }
}
