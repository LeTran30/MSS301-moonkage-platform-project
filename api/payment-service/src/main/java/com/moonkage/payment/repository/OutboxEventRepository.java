package com.moonkage.payment.repository;

import com.moonkage.payment.entity.OutboxEvent;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, String> {

    /** Oldest first, so the events of one payment reach consumers in the order they happened. */
    List<OutboxEvent> findByPublishedAtIsNullOrderByCreatedAtAsc(Pageable page);
}
