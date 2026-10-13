package com.bake2b.identity.service;

import com.bake2b.identity.repository.UserRepository;
import com.bake2b.identity.repository.VerificationCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Covers: FR-01, FR-02. Business logic not implemented yet. */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationCodeRepository verificationCodeRepository;
}
