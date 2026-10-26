package com.moonkage.identity.address;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

interface AddressRepository extends JpaRepository<Address, String> {

    /** Default first, then newest. */
    List<Address> findByAccountIdOrderByIsDefaultDescCreatedAtDesc(String accountId);

    Optional<Address> findByIdAndAccountId(String id, String accountId);
}
