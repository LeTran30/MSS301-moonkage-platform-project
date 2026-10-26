package com.moonkage.identity.profile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
interface UserProfileRepository extends JpaRepository<UserProfile, String> {}
