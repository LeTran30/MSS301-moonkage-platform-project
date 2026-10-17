package com.moonkage.tender.service.impl;

import com.moonkage.tender.repository.TenderInvitationRepository;
import com.moonkage.tender.repository.TenderRequestRepository;
import com.moonkage.tender.service.TenderRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TenderRequestServiceImpl implements TenderRequestService {

    private final TenderRequestRepository tenderRequestRepository;
    private final TenderInvitationRepository tenderInvitationRepository;
}
