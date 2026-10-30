package com.moonkage.identity.profile.application.port;

/**
 * Another profile took the same ID number between the check and the write (BR-23). The database refused the write,
 * so the caller's transaction is lost: catch this outside it.
 */
public final class IdNumberTakenMeanwhile extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public IdNumberTakenMeanwhile(Throwable cause) {
        super("the ID number was taken by another profile in the same instant", cause);
    }
}
