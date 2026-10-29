package com.moonkage.identity.auth.application;

import com.moonkage.identity.account.AccountView;
import com.moonkage.identity.auth.application.port.SessionTokens;
import com.moonkage.identity.profile.FullName;

/** A signed-in account: what login and refresh answer with. */
public record Session(AccountView account, FullName fullName, SessionTokens.Pair tokens) {}
