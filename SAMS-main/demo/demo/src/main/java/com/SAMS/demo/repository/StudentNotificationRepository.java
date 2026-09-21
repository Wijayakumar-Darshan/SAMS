package com.SAMS.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.SAMS.demo.entity.StudentNotification;

import java.util.List;

public interface StudentNotificationRepository extends JpaRepository<StudentNotification, Long> {
  List<StudentNotification> findByStudent_StudentIdOrderByCreatedAtDesc(Long studentId);
}