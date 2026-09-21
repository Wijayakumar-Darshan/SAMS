package com.SAMS.demo.security;

import com.SAMS.demo.entity.UserRole;

public record AuthUser(
    Long userId,
    UserRole role,
    String email
) { }
