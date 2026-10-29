package com.moonkage.identity.auth.application;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.auth.application.port.SessionTokens;
import com.moonkage.identity.profile.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Opens a session for an account that has proved who it is: new tokens and the name it shows. */
@Component
@RequiredArgsConstructor
class SessionOpener {

    private final SessionTokens sessionTokens;
    private final UserProfileService userProfileService;

    Session open(AccountView account) {
        return new Session(
                account, userProfileService.getFullName(account.id().toString()), sessionTokens.issue(account));
    }
}
