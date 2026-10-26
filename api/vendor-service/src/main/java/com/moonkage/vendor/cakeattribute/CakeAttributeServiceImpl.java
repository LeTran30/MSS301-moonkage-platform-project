package com.moonkage.vendor.cakeattribute;

import com.moonkage.vendor.cakeattribute.dto.CakeAttributeResponse;
import com.moonkage.vendor.cakeattribute.dto.CreateCakeAttributeRequest;
import com.moonkage.vendor.cakeattribute.dto.UpdateCakeAttributeRequest;
import com.moonkage.vendor.common.exception.AppException;
import com.moonkage.vendor.common.exception.ErrorCode;
import com.moonkage.vendor.security.CurrentUserInfo;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
class CakeAttributeServiceImpl implements CakeAttributeService {

    private static final String FIELD_LABEL = "label";
    private static final String FIELD_SORT_ORDER = "sortOrder";
    private static final String FIELD_ACTIVE = "active";

    private static final Comparator<CakeAttribute> ADMIN_ORDER = Comparator.comparing(CakeAttribute::getAttributeGroup)
            .thenComparingInt(CakeAttribute::getSortOrder)
            .thenComparing(CakeAttribute::getLabelKey);

    private final CakeAttributeRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<CakeAttributeResponse> getCakeAttributes(
            CurrentUserInfo caller, CakeAttributeGroup group, boolean includeHidden) {
        if (includeHidden) {
            requireAdmin(caller);
        }
        List<CakeAttribute> values = group == null
                ? repository.findAllByOrderByAttributeGroupAscSortOrderAscLabelKeyAsc()
                : repository.findByAttributeGroupOrderBySortOrderAscLabelKeyAsc(group);
        return values.stream()
                .filter(value -> includeHidden || value.isActive())
                .map(CakeAttributeServiceImpl::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CakeAttributeResponse> getByCodes(CakeAttributeGroup group, Collection<String> codes) {
        Set<String> wanted = codes.stream().map(String::trim).collect(Collectors.toSet());
        List<CakeAttribute> values = group == null
                ? repository.findAllByOrderByAttributeGroupAscSortOrderAscLabelKeyAsc()
                : repository.findByAttributeGroupOrderBySortOrderAscLabelKeyAsc(group);
        return values.stream()
                .filter(value -> wanted.contains(value.getCode().value()))
                .map(CakeAttributeServiceImpl::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public CakeAttributeResponse createCakeAttribute(CurrentUserInfo caller, CreateCakeAttributeRequest request) {
        requireAdmin(caller);
        CakeAttributeLabel label = atField(FIELD_LABEL, () -> CakeAttributeLabel.of(request.label()));
        CakeAttribute created =
                atField(FIELD_LABEL, () -> catalogOf(request.group()).add(label));
        return toResponse(saveAndFlush(created));
    }

    @Override
    @Transactional
    public CakeAttributeResponse updateCakeAttribute(
            CurrentUserInfo caller, String attributeId, UpdateCakeAttributeRequest request) {
        requireAdmin(caller);
        CakeAttribute value = repository
                .findById(attributeId)
                .orElseThrow(() -> new AppException(ErrorCode.CAKE_ATTRIBUTE_NOT_FOUND));
        CakeAttributeCatalog catalog = catalogOf(value.getAttributeGroup());

        if (request.label() != null) {
            CakeAttributeLabel label = atField(FIELD_LABEL, () -> CakeAttributeLabel.of(request.label()));
            atField(FIELD_LABEL, () -> catalog.rename(value, label));
        }
        if (request.sortOrder() != null) {
            atField(FIELD_SORT_ORDER, () -> value.reorder(request.sortOrder()));
        }
        if (Boolean.TRUE.equals(request.active())) {
            value.show();
        } else if (Boolean.FALSE.equals(request.active())) {
            atField(FIELD_ACTIVE, () -> catalog.hide(value));
        }
        return toResponse(saveAndFlush(value));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CakeAttributeRef> select(
            CakeAttributeGroup group, Collection<String> codes, Collection<String> linkedIds) {
        if (codes == null || codes.isEmpty()) {
            return List.of();
        }
        Map<CakeAttributeCode, CakeAttribute> byCode =
                repository.findByAttributeGroupOrderBySortOrderAscLabelKeyAsc(group).stream()
                        .collect(Collectors.toMap(CakeAttribute::getCode, Function.identity()));
        List<CakeAttributeRef> selected = new ArrayList<>();
        for (String code : new LinkedHashSet<>(codes)) {
            CakeAttribute value = byCode.get(toCode(code));
            if (value == null || !value.isSelectableBy(linkedIds)) {
                throw notSelectable(code);
            }
            selected.add(value.toRef());
        }
        return selected;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CakeAttributeRef> getRefs(Collection<String> attributeIds) {
        return repository.findAllById(attributeIds).stream()
                .sorted(ADMIN_ORDER)
                .map(CakeAttribute::toRef)
                .toList();
    }

    private CakeAttributeCatalog catalogOf(CakeAttributeGroup group) {
        return new CakeAttributeCatalog(group, repository.findForChangeByGroup(group));
    }

    /**
     * The group lock does not cover a row another admin inserts meanwhile; the unique keys of the table do, and
     * their violation is the same duplicate (AC-54.2).
     */
    private CakeAttribute saveAndFlush(CakeAttribute value) {
        try {
            return repository.saveAndFlush(value);
        } catch (DataIntegrityViolationException e) {
            throw new AppException(
                            ErrorCode.CAKE_ATTRIBUTE_DUPLICATE, value.getLabel().value())
                    .atField(FIELD_LABEL);
        }
    }

    private static CakeAttributeCode toCode(String code) {
        try {
            return CakeAttributeCode.of(code);
        } catch (AppException e) {
            throw notSelectable(code);
        }
    }

    private static AppException notSelectable(String code) {
        return new AppException(ErrorCode.CAKE_ATTRIBUTE_NOT_SELECTABLE, code);
    }

    private static void requireAdmin(CurrentUserInfo caller) {
        if (caller == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        if (!caller.isAdmin()) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }
    }

    private static <T> T atField(String field, Supplier<T> action) {
        try {
            return action.get();
        } catch (AppException e) {
            throw e.atField(field);
        }
    }

    private static void atField(String field, Runnable action) {
        atField(field, () -> {
            action.run();
            return null;
        });
    }

    private static CakeAttributeResponse toResponse(CakeAttribute value) {
        return new CakeAttributeResponse(
                value.getId(),
                value.getAttributeGroup(),
                value.getCode().value(),
                value.getLabel().value(),
                value.getSortOrder(),
                value.isActive());
    }
}
