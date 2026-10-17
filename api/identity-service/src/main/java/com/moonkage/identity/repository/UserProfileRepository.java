package com.moonkage.identity.repository;

import com.moonkage.identity.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/** Keyed by account id. */
@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, String> {}
