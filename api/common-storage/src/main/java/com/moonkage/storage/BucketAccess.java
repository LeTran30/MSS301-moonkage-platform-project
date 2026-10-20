package com.moonkage.storage;

/**
 * Who may read a confirmed file; each value has its own bucket. Uploads always land in the PRIVATE bucket first, under
 * the temp prefix.
 */
public enum BucketAccess {
    PUBLIC,
    PRIVATE
}
