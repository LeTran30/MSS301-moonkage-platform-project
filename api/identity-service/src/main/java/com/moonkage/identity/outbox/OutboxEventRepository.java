package com.moonkage.identity.outbox;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
interface OutboxEventRepository extends JpaRepository<OutboxEvent, String> {

    /** Oldest first, so events of one account reach consumers in the order they happened. */
    List<OutboxEvent> findByPublishedAtIsNullOrderByCreatedAtAsc(Pageable page);
}
