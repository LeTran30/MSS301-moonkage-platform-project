package com.moonkage.identity.controller;

import com.moonkage.identity.dto.request.AddressRequest;
import com.moonkage.identity.dto.response.AddressResponse;
import com.moonkage.identity.security.CurrentUser;
import com.moonkage.identity.security.CurrentUserInfo;
import com.moonkage.identity.service.AddressService;
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
    public ResponseEntity<List<AddressResponse>> getMyAddresses(@CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.ok(addressService.getMyAddresses(currentUser.getAccountId()));
    }

    @PostMapping
    public ResponseEntity<AddressResponse> create(
            @CurrentUser CurrentUserInfo currentUser, @RequestBody @Valid AddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(addressService.create(currentUser.getAccountId(), request));
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<AddressResponse> update(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable String addressId,
            @RequestBody @Valid AddressRequest request) {
        return ResponseEntity.ok(addressService.update(currentUser.getAccountId(), addressId, request));
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> delete(@CurrentUser CurrentUserInfo currentUser, @PathVariable String addressId) {
        addressService.delete(currentUser.getAccountId(), addressId);
        return ResponseEntity.noContent().build();
    }
}
