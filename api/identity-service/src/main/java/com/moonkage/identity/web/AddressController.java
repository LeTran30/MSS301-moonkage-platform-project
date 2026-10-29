package com.moonkage.identity.web;

import com.moonkage.identity.address.AddressService;
import com.moonkage.identity.address.dto.AddAddressRequest;
import com.moonkage.identity.address.dto.AddAddressResponse;
import com.moonkage.identity.platform.security.CurrentUser;
import com.moonkage.identity.platform.security.CurrentUserInfo;
import com.moonkage.identity.platform.web.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** FR-03: delivery addresses of the logged-in user. */
@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AddAddressResponse>>> getMyAddresses(
            @CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(addressService.getMyAddresses(currentUser.accountId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AddAddressResponse>> create(
            @CurrentUser CurrentUserInfo currentUser, @RequestBody @Valid AddAddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(addressService.create(currentUser.accountId(), request)));
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<ApiResponse<AddAddressResponse>> update(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable String addressId,
            @RequestBody @Valid AddAddressRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(addressService.update(currentUser.accountId(), addressId, request)));
    }

    /** 204: nothing to wrap. */
    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> delete(@CurrentUser CurrentUserInfo currentUser, @PathVariable String addressId) {
        addressService.delete(currentUser.accountId(), addressId);
        return ResponseEntity.noContent().build();
    }
}
