package com.moonkage.vendor.web;

import com.moonkage.vendor.cakeattribute.CakeAttributeGroup;
import com.moonkage.vendor.cakeattribute.CakeAttributeService;
import com.moonkage.vendor.cakeattribute.dto.CakeAttributeResponse;
import com.moonkage.vendor.cakeattribute.dto.CreateCakeAttributeRequest;
import com.moonkage.vendor.cakeattribute.dto.UpdateCakeAttributeRequest;
import com.moonkage.vendor.common.exception.ApiResponse;
import com.moonkage.vendor.security.CurrentUser;
import com.moonkage.vendor.security.CurrentUserInfo;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Root CakeAttribute (docs/architecture/api-db/vendor.md): the catalogue of crusts and fillings (FR-54). */
@RestController
@RequestMapping("/api/cake-attributes")
@RequiredArgsConstructor
public class CakeAttributeController {

    private final CakeAttributeService cakeAttributeService;

    /** Open to guests: the buyer's filter (AC-06.6) and the seller's picker (AC-29.1); hidden values admin only. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CakeAttributeResponse>>> getCakeAttributes(
            @CurrentUser(required = false) CurrentUserInfo caller,
            @RequestParam(required = false) CakeAttributeGroup group,
            @RequestParam(defaultValue = "false") boolean includeHidden) {
        return ResponseEntity.ok(ApiResponse.ok(cakeAttributeService.getCakeAttributes(caller, group, includeHidden)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CakeAttributeResponse>> createCakeAttribute(
            @CurrentUser CurrentUserInfo caller, @Valid @RequestBody CreateCakeAttributeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(cakeAttributeService.createCakeAttribute(caller, request)));
    }

    @PatchMapping("/{attributeId}")
    public ResponseEntity<ApiResponse<CakeAttributeResponse>> updateCakeAttribute(
            @CurrentUser CurrentUserInfo caller,
            @PathVariable String attributeId,
            @RequestBody UpdateCakeAttributeRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(cakeAttributeService.updateCakeAttribute(caller, attributeId, request)));
    }
}
