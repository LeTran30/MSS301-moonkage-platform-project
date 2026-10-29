package com.moonkage.identity.profile;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.moonkage.identity.account.AccountService;
import com.moonkage.identity.account.dto.AccountResponse;
import com.moonkage.identity.account.dto.AccountView;
import com.moonkage.identity.shared.Role;
import com.moonkage.identity.shared.error.AppException;
import com.moonkage.identity.shared.error.LegacyError;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceImplTest {

    private static final String ACCOUNT_ID = "6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10";

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private AccountService accountService;

    @InjectMocks
    private UserProfileServiceImpl service;

    @Test
    void myAccountCarriesTheProfileName() {
        when(accountService.getAccount(ACCOUNT_ID))
                .thenReturn(new AccountView(ACCOUNT_ID, "a@x.vn", "912345678", Role.MEMBER, true, null));
        when(userProfileRepository.findById(ACCOUNT_ID))
                .thenReturn(Optional.of(UserProfile.builder()
                        .accountId(ACCOUNT_ID)
                        .fullName("Lan Nguyen")
                        .build()));

        AccountResponse response = service.getMyAccount(ACCOUNT_ID);

        assertEquals(ACCOUNT_ID, response.accountId());
        assertEquals("a@x.vn", response.email());
        assertEquals("912345678", response.phoneNumber());
        assertEquals("Lan Nguyen", response.fullName());
        assertEquals(Role.MEMBER, response.role());
    }

    @Test
    void missingProfileAnswersNotFound() {
        when(userProfileRepository.findById(ACCOUNT_ID)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> service.getFullName(ACCOUNT_ID));

        assertEquals(LegacyError.USER_PROFILE_NOT_FOUND, ex.getErrorCode());
    }
}
