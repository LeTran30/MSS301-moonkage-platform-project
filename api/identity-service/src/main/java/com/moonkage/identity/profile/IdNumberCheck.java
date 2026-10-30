package com.moonkage.identity.profile;

import com.moonkage.identity.shared.MaskedIdNumber;

/**
 * A declared ID number, fingerprinted, next to the KYC of the profile it was declared for (BR-27).
 *
 * @param keyVersion the pepper version {@code hash} was made with
 * @param matchesProfile whether it is the number on the profile's verified card
 */
public record IdNumberCheck(
        IdNumberHash hash, int keyVersion, MaskedIdNumber masked, boolean matchesProfile, ProfileKyc owner) {}
