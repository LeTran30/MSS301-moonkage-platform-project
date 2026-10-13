package com.bake2b.tender.controller;

import com.bake2b.tender.service.TenderRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Covers: FR-15, FR-16, FR-23, FR-36. Endpoints not implemented yet. */
@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class TenderRequestController {

    private final TenderRequestService tenderRequestService;
}
