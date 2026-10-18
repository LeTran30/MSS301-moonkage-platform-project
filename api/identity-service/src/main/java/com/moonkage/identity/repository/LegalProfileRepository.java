package com.moonkage.identity.repository;

import com.moonkage.identity.entity.LegalProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LegalProfileRepository extends JpaRepository<LegalProfile, String> {

    boolean existsByIdNumberHashAndIdHashKeyVer(String idNumberHash, Integer idHashKeyVer);
}
