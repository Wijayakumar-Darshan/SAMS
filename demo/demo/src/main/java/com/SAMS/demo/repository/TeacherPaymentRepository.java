package com.SAMS.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.SAMS.demo.entity.TeacherPayment;

import java.util.List;

public interface TeacherPaymentRepository extends JpaRepository<TeacherPayment, Long> {
  List<TeacherPayment> findByTeacher_TeacherIdOrderByCreatedAtDesc(Long teacherId);
  long countByStatus(com.SAMS.demo.entity.PaymentStatus status);
  void deleteAllByTeacher_TeacherId(Long teacherId);

}