package com.bake2b.tender.service.impl;

import com.bake2b.tender.repository.TenderRequestRepository;
import com.bake2b.tender.repository.TenderInvitationRepository;
import com.bake2b.tender.service.TenderRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Covers: FR-15, FR-16, FR-23, FR-36. Business logic not implemented yet. */
@Service
@RequiredArgsConstructor
public class TenderRequestServiceImpl implements TenderRequestService {

    private final TenderRequestRepository tenderRequestRepository;
    private final TenderInvitationRepository tenderInvitationRepository;
}
