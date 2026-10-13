package com.bake2b.identity.repository;

import com.bake2b.identity.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AddressRepository extends JpaRepository<Address, String> {
}
