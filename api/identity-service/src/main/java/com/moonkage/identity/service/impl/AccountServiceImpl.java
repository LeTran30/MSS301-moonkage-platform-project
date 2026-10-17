package com.moonkage.identity.service.impl;

import com.moonkage.identity.dto.response.AccountRefResponse;
import com.moonkage.identity.repository.AccountRepository;
import com.moonkage.identity.service.AccountService;
import java.util.Locale;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<AccountRefResponse> findRefByEmail(String email) {
        return accountRepository
                .findByEmail(email.trim().toLowerCase(Locale.ROOT))
                .map(a -> new AccountRefResponse(a.getId()));
    }
}
