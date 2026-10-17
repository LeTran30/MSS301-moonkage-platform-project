package com.moonkage.identity.controller;

import com.moonkage.identity.repository.AccountRepository;
import io.swagger.v3.oas.annotations.Hidden;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Called by other services through OpenFeign only; the gateway blocks internal paths from outside. */
@Hidden
@RestController
@RequestMapping("/internal/accounts")
@RequiredArgsConstructor
public class InternalAccountController {

    private final AccountRepository accountRepository;

    public record AccountRef(String accountId) {}

    /** Used by vendor-service to attach the demo Shop to the seeded seller account. 404 when unknown. */
    @GetMapping("/by-email")
    public ResponseEntity<AccountRef> getByEmail(@RequestParam String email) {
        return ResponseEntity.of(accountRepository
                .findByEmail(email.trim().toLowerCase(Locale.ROOT))
                .map(a -> new AccountRef(a.getId())));
    }
}
