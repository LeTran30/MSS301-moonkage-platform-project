package com.moonkage.quotation.repository;

import com.moonkage.quotation.entity.RequestInvitation;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestInvitationRepository extends JpaRepository<RequestInvitation, String> {

    List<RequestInvitation> findByRequestIdOrderByCreatedAtAsc(String requestId);

    List<RequestInvitation> findByRequestIdIn(Collection<String> requestIds);

    Optional<RequestInvitation> findByRequestIdAndVendorId(String requestId, String vendorId);
}
