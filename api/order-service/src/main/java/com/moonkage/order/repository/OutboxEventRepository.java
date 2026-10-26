package com.moonkage.order.repository;

import com.moonkage.order.entity.OutboxEvent;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, String> {

    /** Oldest first, so the events of one order reach consumers in the order they happened. */
    List<OutboxEvent> findByPublishedAtIsNullOrderByCreatedAtAsc(Pageable page);
}
