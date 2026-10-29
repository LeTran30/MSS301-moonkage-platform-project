package com.moonkage.identity.account.application;

import com.moonkage.identity.account.AccountError;
import com.moonkage.identity.shared.error.AppException;

/** The one way this module says "no such account": the message names the id that was asked for. */
final class AccountNotFound {

    private AccountNotFound() {}

    static AppException of(Object requestedId) {
        return new AppException(AccountError.NOT_FOUND, String.valueOf(requestedId));
    }
}
