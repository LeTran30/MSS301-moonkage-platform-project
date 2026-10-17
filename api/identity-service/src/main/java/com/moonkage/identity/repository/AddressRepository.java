package com.moonkage.identity.repository;

import com.moonkage.identity.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AddressRepository extends JpaRepository<Address, String> {}
