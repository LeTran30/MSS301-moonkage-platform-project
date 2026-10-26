package com.moonkage.vendor.vendor;

import com.moonkage.vendor.cakeattribute.CakeAttributeGroup;
import com.moonkage.vendor.cakeattribute.CakeAttributeRef;
import com.moonkage.vendor.cakeattribute.CakeAttributeService;
import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.common.vo.PriceTier;
import com.moonkage.vendor.common.vo.PriceTiers;
import com.moonkage.vendor.common.vo.Quantity;
import com.moonkage.vendor.security.CurrentUserInfo;
import com.moonkage.vendor.vendor.dto.request.SaveOrderProfileRequest;
import com.moonkage.vendor.vendor.dto.response.OrderProfileResponse;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.function.Supplier;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
class OrderProfileServiceImpl implements OrderProfileService {

    private final VendorFinder vendorFinder;
    private final OrderProfileRepository orderProfileRepository;
    private final CakeAttributeService cakeAttributeService;
    private final VendorSnapshotPublisher snapshotPublisher;

    @Override
    @Transactional(readOnly = true)
    public OrderProfileResponse getOrderProfile(CurrentUserInfo caller, String vendorId) {
        vendorFinder.getVisibleTo(caller, vendorId);
        return orderProfileRepository
                .findByVendorId(vendorId)
                .map(this::toResponse)
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
        Optional<OrderProfile> existing = orderProfileRepository.findByVendorId(vendorId);
        Set<String> linkedIds =
                existing.map(OrderProfile::getCakeAttributeIds).map(Set::copyOf).orElse(Set.of());
        OrderTerms terms = toTerms(request, vendor.getSupplySource(), linkedIds);

        OrderProfile profile = existing.map(current -> {
                    current.replace(terms);
                    return current;
                })
                .orElseGet(() -> orderProfileRepository.save(OrderProfile.of(vendorId, terms)));
        snapshotPublisher.announceUpdated(vendor, caller.accountId());
        return toResponse(profile);
    }

    /** Each value object at its field; whether the terms are complete for the supply source is OrderTerms' rule. */
    private OrderTerms toTerms(SaveOrderProfileRequest request, SupplySource supplySource, Set<String> linkedIds) {
        return new OrderTerms(
                supplySource,
                atField(OrderTerms.MIN_QTY, () -> Quantity.of(request.minQty())),
                request.leadTimeDays(),
                atField(
                        OrderTerms.PRICE_TIERS,
                        () -> PriceTiers.of(request.priceTiers().stream()
                                .map(tier -> PriceTier.of(tier.fromQty(), tier.unitPrice()))
                                .toList())),
                request.customTypes(),
                request.earlyBirdOffer(),
                optionalQuantity(OrderTerms.WEEKLY_CAPACITY, request.weeklyCapacity()),
                select(OrderTerms.CRUST_CODES, CakeAttributeGroup.CRUST, request.crustCodes(), linkedIds),
                select(OrderTerms.FILLING_CODES, CakeAttributeGroup.FILLING, request.fillingCodes(), linkedIds),
                request.packagingTypes(),
                request.logoPrinting(),
                request.distributedBrands(),
                optionalQuantity(OrderTerms.GATHERABLE_QTY, request.gatherableQty()));
    }

    private List<CakeAttributeRef> select(
            String field, CakeAttributeGroup group, List<String> codes, Set<String> linkedIds) {
        return atField(field, () -> cakeAttributeService.select(group, codes, linkedIds));
    }

    /** Left out is null (OrderTerms decides whether it was required); sent, it must be a quantity. */
    private static Quantity optionalQuantity(String field, Integer value) {
        return value == null ? null : atField(field, () -> Quantity.of(value));
    }

    private static <T> T atField(String field, Supplier<T> valueObject) {
        try {
            return valueObject.get();
        } catch (AppException e) {
            throw e.atField(field);
        }
    }

    private OrderProfileResponse toResponse(OrderProfile profile) {
        List<OrderProfileResponse.PriceTier> tiers = profile.toPriceTiers().tiers().stream()
                .map(tier -> new OrderProfileResponse.PriceTier(
                        tier.fromQty().value(), tier.unitPrice().value()))
                .toList();
        CakeAttributeCodes cakeAttributes =
                CakeAttributeCodes.of(cakeAttributeService.getRefs(profile.getCakeAttributeIds()));
        return new OrderProfileResponse(
                profile.getMinQty().value(),
                profile.getLeadTimeDays(),
                tiers,
                Set.copyOf(profile.getCustomTypes()),
                profile.getEarlyBirdOffer(),
                valueOf(profile.getWeeklyCapacity()),
                cakeAttributes.crusts(),
                cakeAttributes.fillings(),
                profile.getPackagingTypes(),
                profile.getLogoPrinting(),
                profile.getDistributedBrands(),
                valueOf(profile.getGatherableQty()),
                profile.getUpdatedAt());
    }

    private static Integer valueOf(Quantity quantity) {
        return quantity == null ? null : quantity.value();
    }
}
