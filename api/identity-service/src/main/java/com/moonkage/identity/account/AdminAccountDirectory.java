package com.moonkage.identity.account;

import com.moonkage.identity.account.atom.Role;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Read-only internal directory used to address operational notifications to every administrator. */
@Service
@RequiredArgsConstructor
public class AdminAccountDirectory {

    private final AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public List<String> accountIds() {
        return accountRepository.findAllByRole(Role.ADMIN).stream()
                .map(Account::getId)
                .toList();
    }
}
