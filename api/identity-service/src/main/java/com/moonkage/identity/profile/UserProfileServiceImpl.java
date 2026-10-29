package com.moonkage.identity.profile;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.profile.dto.AccountResponse;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.LegacyError;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
class UserProfileServiceImpl implements UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final AccountApi accountApi;

    @Override
    @Transactional(readOnly = true)
    public AccountResponse getMyAccount(String accountId) {
        AccountView account = AccountId.tryParse(accountId)
                .flatMap(accountApi::find)
                .orElseThrow(() -> new AppException(AccountError.NOT_FOUND, accountId));
        return UserProfileMapper.toAccountResponse(account, getFullName(accountId));
    }

    @Override
    @Transactional
    public void createProfile(String accountId, String fullName) {
        userProfileRepository.save(
                UserProfile.builder().accountId(accountId).fullName(fullName).build());
    }

    @Override
    @Transactional(readOnly = true)
    public String getFullName(String accountId) {
        return findFullName(accountId).orElseThrow(() -> new AppException(LegacyError.USER_PROFILE_NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> findFullName(String accountId) {
        return userProfileRepository.findById(accountId).map(UserProfile::getFullName);
    }
}
