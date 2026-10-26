package com.moonkage.identity.kyc;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
interface LegalProfileRepository extends JpaRepository<LegalProfile, String> {

    boolean existsByIdNumberHashAndIdHashKeyVer(String idNumberHash, Integer idHashKeyVer);
}
