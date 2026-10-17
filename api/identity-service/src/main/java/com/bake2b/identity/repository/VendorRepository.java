package com.bake2b.identity.repository;

import com.bake2b.identity.entity.Vendor;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendorRepository extends JpaRepository<Vendor, String> {

    Optional<Vendor> findByOwnerId(String userId);
}
