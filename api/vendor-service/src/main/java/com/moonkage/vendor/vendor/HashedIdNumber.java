package com.moonkage.vendor.vendor;

/**
 * The representative's ID number in the only forms vendor-service keeps (NFR-03, D-07): the keyed hash made by
 * identity-service, its key version, and the masked number.
 */
record HashedIdNumber(String hash, int keyVersion, String masked) {}
