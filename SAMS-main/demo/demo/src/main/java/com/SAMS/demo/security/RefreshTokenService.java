package com.SAMS.demo.security;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.SAMS.demo.entity.RefreshToken;
import com.SAMS.demo.entity.UserType;
import com.SAMS.demo.repository.RefreshTokenRepository;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

@Service
public class RefreshTokenService {

  private final RefreshTokenRepository repo;
  private final int refreshDays;
  private final SecureRandom random = new SecureRandom();

  public RefreshTokenService(
      RefreshTokenRepository repo,
      @Value("${app.jwt.refreshDays}") int refreshDays
  ) {
    this.repo = repo;
    this.refreshDays = refreshDays;
  }

  public RefreshToken create(UserType userType, Long userId) {
    repo.deleteByExpiresAtBefore(Instant.now());

    RefreshToken rt = new RefreshToken();
    rt.setUserType(userType);
    rt.setUserId(userId);
    rt.setExpiresAt(Instant.now().plus(refreshDays, ChronoUnit.DAYS));
    rt.setToken(generateTokenValue());
    return repo.save(rt);
  }

  public RefreshToken validateAndGet(String token) {
    RefreshToken rt = repo.findByToken(token)
        .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

    if (rt.getExpiresAt().isBefore(Instant.now())) {
      repo.delete(rt);
      throw new IllegalArgumentException("Refresh token expired");
    }
    return rt;
  }

  public void revoke(String token) {
    repo.findByToken(token).ifPresent(repo::delete);
  }

  private String generateTokenValue() {
    byte[] buf = new byte[48];
    random.nextBytes(buf);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
  }
}
