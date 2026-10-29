package com.moonkage.identity.profile.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.moonkage.identity.account.AccountApi;
import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.profile.FullName;
import com.moonkage.identity.profile.ProfileError;
import com.moonkage.identity.profile.application.GetMyAccount.MyAccount;
import com.moonkage.identity.profile.application.port.ProfileRepository;
import com.moonkage.identity.profile.domain.Profile;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.Role;
import com.moonkage.identity.shared.error.AppException;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class GetMyAccountTest {

    private static final AccountId ID = AccountId.fromStored("6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10");
    private static final AccountView ACCOUNT =
            new AccountView(ID, Email.parse("a@x.vn"), PhoneNumber.parse("0912345678"), Role.MEMBER, true, null);
    private static final FullName NAME = new FullName("Lan Nguyen");

    private final AccountApi accountApi = mock(AccountApi.class);
    private final ProfileRepository profiles = mock(ProfileRepository.class);
    private final GetMyAccount getMyAccount = new GetMyAccount(accountApi, new ProfileQueries(profiles));

    @Test
    void myAccountCarriesTheProfileName() {
        when(accountApi.find(ID)).thenReturn(Optional.of(ACCOUNT));
        when(profiles.find(ID)).thenReturn(Optional.of(Profile.create(ID, NAME)));

        assertEquals(new MyAccount(ACCOUNT, NAME), getMyAccount.handle(ID));
    }

    @Test
    void missingAccountThenMissingProfileAnswerNotFound() {
        assertEquals(
                AccountError.NOT_FOUND,
                assertThrows(AppException.class, () -> getMyAccount.handle(ID)).getErrorCode());

        when(accountApi.find(ID)).thenReturn(Optional.of(ACCOUNT));
        assertEquals(
                ProfileError.NOT_FOUND,
                assertThrows(AppException.class, () -> getMyAccount.handle(ID)).getErrorCode());
    }
}
