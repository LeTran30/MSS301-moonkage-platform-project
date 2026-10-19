package com.moonkage.storage;

/**
 * Who may read a confirmed file; each value has its own bucket. Uploads always land in the PRIVATE bucket first, under
 * the temp prefix.
 */
public enum BucketAccess {
    /** Anyone can read it by URL, e.g. product images. */
    PUBLIC,
    /** Read only through a presigned link the owning service hands out after its own permission check. */
    PRIVATE
}
