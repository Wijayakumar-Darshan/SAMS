package com.SAMS.demo.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.SAMS.demo.entity.UserRole;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

  private final Key key;
  private final int accessMinutes;

  public JwtService(
      @Value("${app.jwt.secret}") String secret,
      @Value("${app.jwt.accessMinutes}") int accessMinutes
  ) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.accessMinutes = accessMinutes;
  }

  public String createAccessToken(Long userId, UserRole role, String email) {
    Instant now = Instant.now();
    Instant exp = now.plus(accessMinutes, ChronoUnit.MINUTES);

    return Jwts.builder()
        .setSubject(String.valueOf(userId))
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(exp))
        .addClaims(Map.of(
            "role", role.name(),
            "email", email
        ))
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  public Jws<Claims> parse(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token);
  }

  public AuthUser toAuthUser(String token) {
    Claims c = parse(token).getBody();
    Long userId = Long.parseLong(c.getSubject());
    UserRole role = UserRole.valueOf((String) c.get("role"));
    String email = (String) c.get("email");
    return new AuthUser(userId, role, email);
  }
}
