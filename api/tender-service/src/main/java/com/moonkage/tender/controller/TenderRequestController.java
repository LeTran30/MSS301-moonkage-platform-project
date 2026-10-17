package com.moonkage.tender.controller;

import com.moonkage.tender.service.TenderRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class TenderRequestController {

    private final TenderRequestService tenderRequestService;
}
