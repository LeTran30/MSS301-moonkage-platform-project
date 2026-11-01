package com.moonkage.identity.account.dto;

import com.moonkage.identity.account.atom.PasswordHash;

/** What login needs to check a password (FR-02). Only security reads it; the hash prints as [PROTECTED]. */
public record AccountCredentials(AccountView account, PasswordHash passwordHash) {}
