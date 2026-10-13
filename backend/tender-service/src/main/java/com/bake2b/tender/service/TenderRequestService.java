package com.bake2b.tender.service;

import com.bake2b.tender.repository.TenderRequestRepository;
import com.bake2b.tender.repository.TenderInvitationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Covers: FR-15, FR-16, FR-23, FR-36. Business logic not implemented yet. */
@Service
@RequiredArgsConstructor
public class TenderRequestService {

    private final TenderRequestRepository tenderRequestRepository;
    private final TenderInvitationRepository tenderInvitationRepository;
}
