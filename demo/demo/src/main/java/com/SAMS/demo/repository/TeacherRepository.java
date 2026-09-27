package com.SAMS.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.SAMS.demo.entity.Teacher;

import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
  Optional<Teacher> findByEmail(String email);
  boolean existsByEmail(String email);
  boolean existsByOtp(String otp);
  boolean existsByMappingCode(String mappingCode);
  Optional<Teacher> findByMappingCode(String mappingCode);
}
