package com.moonkage.quotation.service.impl;

import com.moonkage.quotation.common.exception.AppException;
import com.moonkage.quotation.common.exception.ErrorCode;
import com.moonkage.quotation.dto.response.SupplierResponse;
import com.moonkage.quotation.entity.VendorSnapshot;
import com.moonkage.quotation.enums.CustomType;
import com.moonkage.quotation.mapper.SupplierMapper;
import com.moonkage.quotation.repository.VendorSnapshotRepository;
import com.moonkage.quotation.service.SupplierService;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** FR-14: vendors taking custom orders, including order-only ones that have no Shop (AC-14.3). */
@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {

    private final VendorSnapshotRepository vendorSnapshotRepository;
    private final VendorDirectory vendorDirectory;

    @Override
    @Transactional(readOnly = true)
    public List<SupplierResponse> searchSuppliers(
            String accountId, String provinceCode, CustomType customType, Integer quantity, String name) {
        String ownVendorId = vendorDirectory
                .findOwnedBy(accountId)
                .map(VendorSnapshot::getVendorId)
                .orElse(null);
        String needle = name == null ? "" : name.strip().toLowerCase(Locale.ROOT);
        return vendorSnapshotRepository.findByAcceptsOrdersTrueAndCanOperateTrueOrderByBusinessNameAsc().stream()
                .filter(v -> provinceCode == null || v.deliversTo(provinceCode))
                .filter(v -> customType == null || v.canMake(EnumSet.of(customType)))
                .filter(v -> quantity == null || v.meetsMinQty(quantity))
                .filter(v -> v.getBusinessName().toLowerCase(Locale.ROOT).contains(needle))
                .map(v -> SupplierMapper.toResponse(v, v.getVendorId().equals(ownVendorId)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierResponse getSupplier(String accountId, String vendorId) {
        VendorSnapshot vendor = vendorDirectory.getVendor(vendorId);
        if (!vendor.isAcceptsOrders()) {
            throw new AppException(ErrorCode.VENDOR_NOT_FOUND);
        }
        return SupplierMapper.toResponse(vendor, accountId != null && vendor.isOwnedBy(accountId));
    }
}
