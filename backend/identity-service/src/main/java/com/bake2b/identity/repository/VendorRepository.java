package com.bake2b.identity.repository;

import com.bake2b.identity.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VendorRepository extends JpaRepository<Vendor, String> {

    Optional<Vendor> findByOwnerId(String userId);
}
