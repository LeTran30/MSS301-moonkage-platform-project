package com.moonkage.identity.address.infrastructure.web;

import com.moonkage.identity.address.AddressError;
import com.moonkage.identity.address.application.AddAddress;
import com.moonkage.identity.address.application.AddressQueries;
import com.moonkage.identity.address.application.EditAddress;
import com.moonkage.identity.address.application.RemoveAddress;
import com.moonkage.identity.address.domain.AddressId;
import com.moonkage.identity.address.infrastructure.web.AddressRequest.SubmittedAddress;
import com.moonkage.identity.platform.security.CurrentUser;
import com.moonkage.identity.platform.security.CurrentUserInfo;
import com.moonkage.identity.platform.web.ApiResponse;
import com.moonkage.identity.shared.error.AppException;
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
class AddressController {

    private final AddAddress addAddress;
    private final EditAddress editAddress;
    private final RemoveAddress removeAddress;
    private final AddressQueries addressQueries;

    @GetMapping
    ResponseEntity<ApiResponse<List<AddressResponse>>> list(@CurrentUser CurrentUserInfo currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(addressQueries.list(currentUser.accountId()).stream()
                .map(AddressResponse::from)
                .toList()));
    }

    @PostMapping
    ResponseEntity<ApiResponse<AddressResponse>> add(
            @CurrentUser CurrentUserInfo currentUser, @RequestBody AddressRequest request) {
        SubmittedAddress submitted = request.parse();
        AddAddress.Command command = new AddAddress.Command(
                currentUser.accountId(),
                submitted.contact(),
                submitted.label(),
                Boolean.TRUE.equals(submitted.isDefault()));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(AddressResponse.from(addAddress.handle(command))));
    }

    /** The body is checked before the id, so a bad body answers 400 whatever the id. */
    @PutMapping("/{addressId}")
    ResponseEntity<ApiResponse<AddressResponse>> edit(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable String addressId,
            @RequestBody AddressRequest request) {
        SubmittedAddress submitted = request.parse();
        EditAddress.Command command = new EditAddress.Command(
                currentUser.accountId(),
                addressId(addressId),
                submitted.contact(),
                submitted.label(),
                submitted.isDefault());
        return ResponseEntity.ok(ApiResponse.ok(AddressResponse.from(editAddress.handle(command))));
    }

    /** 204: nothing to wrap. */
    @DeleteMapping("/{addressId}")
    ResponseEntity<Void> remove(@CurrentUser CurrentUserInfo currentUser, @PathVariable String addressId) {
        removeAddress.handle(currentUser.accountId(), addressId(addressId));
        return ResponseEntity.noContent().build();
    }

    /** An id that is no UUID cannot be in any book: it answers like an unknown one, echoing what was sent. */
    private static AddressId addressId(String raw) {
        return AddressId.tryParse(raw).orElseThrow(() -> new AppException(AddressError.NOT_FOUND, raw));
    }
}
