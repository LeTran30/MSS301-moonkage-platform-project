package com.bake2b.identity.repository;

import com.bake2b.identity.entity.VendorDocument;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VendorDocumentRepository extends JpaRepository<VendorDocument, String> {
}
