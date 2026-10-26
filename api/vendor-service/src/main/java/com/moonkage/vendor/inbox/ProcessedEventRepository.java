package com.moonkage.vendor.inbox;

import org.springframework.data.jpa.repository.JpaRepository;

interface ProcessedEventRepository extends JpaRepository<ProcessedEvent, String> {}
