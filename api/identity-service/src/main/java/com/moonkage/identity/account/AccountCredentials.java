package com.moonkage.identity.account;

import com.moonkage.identity.account.vo.PasswordHash;

/** What login needs to check a password (FR-02). Only security reads it; the hash prints as [PROTECTED]. */
public record AccountCredentials(AccountView account, PasswordHash passwordHash) {}
