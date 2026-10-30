package com.moonkage.identity.account.application;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.account.application.GetMyAccount.MyAccount;
import com.moonkage.identity.profile.FullName;
import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.profile.ProfileError;
import com.moonkage.identity.shared.AccountId;
import com.moonkage.identity.shared.Email;
import com.moonkage.identity.shared.PhoneNumber;
import com.moonkage.identity.shared.Role;
import com.moonkage.identity.shared.error.AppException;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class GetMyAccountTest {

    private static final AccountId ID =
            AccountId.tryParse("6f1c2a4e-8d3b-4f7a-9c21-5b0e7d9a3f10").orElseThrow();
    private static final AccountView ACCOUNT =
            new AccountView(ID, Email.parse("a@x.vn"), PhoneNumber.parse("0912345678"), Role.MEMBER, true, null);
    private static final FullName NAME = new FullName("Lan Nguyen");

    private final AccountQueries accounts = mock(AccountQueries.class);
    private final ProfileApi profileApi = mock(ProfileApi.class);
    private final GetMyAccount getMyAccount = new GetMyAccount(accounts, profileApi);

    @Test
    void myAccountCarriesTheProfileName() {
        when(accounts.get(ID)).thenReturn(ACCOUNT);
        when(profileApi.findFullName(ID)).thenReturn(Optional.of(NAME));

        assertEquals(new MyAccount(ACCOUNT, NAME), getMyAccount.handle(ID));
    }

    @Test
    void missingAccountThenMissingProfileAnswerNotFound() {
        when(accounts.get(ID)).thenThrow(new AppException(AccountError.NOT_FOUND, ID.toString()));
        assertEquals(
                AccountError.NOT_FOUND,
                assertThrows(AppException.class, () -> getMyAccount.handle(ID)).getErrorCode());

        doReturn(ACCOUNT).when(accounts).get(ID);
        assertEquals(
                ProfileError.NOT_FOUND,
                assertThrows(AppException.class, () -> getMyAccount.handle(ID)).getErrorCode());
    }
}
