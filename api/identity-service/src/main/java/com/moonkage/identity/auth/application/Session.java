package com.moonkage.identity.auth.application;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.auth.application.port.SessionTokens;

/** A signed-in account: what login and refresh answer with. */
public record Session(AccountView account, String fullName, SessionTokens.Pair tokens) {}
