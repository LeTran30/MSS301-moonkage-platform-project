package com.moonkage.identity.profile;

import com.moonkage.identity.account.AccountService;
import com.moonkage.identity.account.dto.AccountResponse;
import com.moonkage.identity.account.dto.AccountView;
import com.moonkage.identity.common.exception.AppException;
import com.moonkage.identity.common.exception.ErrorCode;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
class UserProfileServiceImpl implements UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final AccountService accountService;

    @Override
    @Transactional(readOnly = true)
    public AccountResponse getMyAccount(String accountId) {
        AccountView account = accountService.getAccount(accountId);
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
        return findFullName(accountId).orElseThrow(() -> new AppException(ErrorCode.USER_PROFILE_NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<String> findFullName(String accountId) {
        return userProfileRepository.findById(accountId).map(UserProfile::getFullName);
    }
}
