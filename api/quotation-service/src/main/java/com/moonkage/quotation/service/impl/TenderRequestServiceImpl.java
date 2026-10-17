package com.moonkage.quotation.service.impl;

import com.moonkage.quotation.repository.TenderInvitationRepository;
import com.moonkage.quotation.repository.TenderRequestRepository;
import com.moonkage.quotation.service.TenderRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TenderRequestServiceImpl implements TenderRequestService {

    private final TenderRequestRepository tenderRequestRepository;
    private final TenderInvitationRepository tenderInvitationRepository;
}
