package com.SAMS.demo.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.SAMS.demo.entity.AdminUser;

import java.util.Optional;

public interface AdminUserRepository extends JpaRepository<AdminUser, Long> {
  Optional<AdminUser> findByEmail(String email);
  boolean existsByEmail(String email);
}
