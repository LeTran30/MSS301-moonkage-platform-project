package com.moonkage.identity.repository;

import com.moonkage.identity.entity.Vendor;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendorRepository extends JpaRepository<Vendor, String> {

    Optional<Vendor> findByOwnerId(String userId);
}
