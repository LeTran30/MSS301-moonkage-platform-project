package com.moonkage.identity.nfc.infrastructure.scheduling;

import com.moonkage.identity.nfc.application.ExpireNfcSessions;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Runs {@link ExpireNfcSessions} every {@code nfc.session-cleanup-interval}. */
@Component
@RequiredArgsConstructor
class NfcSessionCleanupJob {

    private final ExpireNfcSessions expireNfcSessions;

    @Scheduled(fixedDelayString = "${nfc.session-cleanup-interval}")
    void run() {
        expireNfcSessions.handle();
    }
}
