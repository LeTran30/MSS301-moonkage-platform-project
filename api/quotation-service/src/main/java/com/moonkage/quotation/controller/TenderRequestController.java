package com.moonkage.quotation.controller;

import com.moonkage.quotation.service.TenderRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class TenderRequestController {

    private final TenderRequestService tenderRequestService;
}
