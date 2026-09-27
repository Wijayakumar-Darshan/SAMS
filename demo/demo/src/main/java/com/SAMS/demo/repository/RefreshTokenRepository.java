package com.SAMS.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.SAMS.demo.entity.RefreshToken;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
  Optional<RefreshToken> findByToken(String token);
  void deleteByExpiresAtBefore(Instant time);
}