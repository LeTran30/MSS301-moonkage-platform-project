package com.moonkage.order.repository;

import com.moonkage.order.entity.DisputeEvidence;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DisputeEvidenceRepository extends JpaRepository<DisputeEvidence, String> {

    List<DisputeEvidence> findByDisputeIdOrderByCreatedAtAsc(String disputeId);
}
