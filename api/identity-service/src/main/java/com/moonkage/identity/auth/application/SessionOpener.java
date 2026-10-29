package com.moonkage.identity.auth.application;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.auth.application.port.SessionTokens;
import com.moonkage.identity.profile.FullName;
import com.moonkage.identity.profile.ProfileApi;
import com.moonkage.identity.profile.ProfileError;
import com.moonkage.identity.shared.error.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Opens a session for an account that has proved who it is: new tokens and the name it shows. */
@Component
@RequiredArgsConstructor
class SessionOpener {

    private final SessionTokens sessionTokens;
    private final ProfileApi profileApi;

    /** Throws NOT_FOUND of the profile. */
    Session open(AccountView account) {
        FullName fullName =
                profileApi.findFullName(account.id()).orElseThrow(() -> new AppException(ProfileError.NOT_FOUND));
        return new Session(account, fullName, sessionTokens.issue(account));
    }
}
