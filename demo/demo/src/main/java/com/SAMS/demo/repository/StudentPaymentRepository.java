package com.SAMS.demo.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.SAMS.demo.entity.StudentPayment;

import java.util.List;

public interface StudentPaymentRepository extends JpaRepository<StudentPayment, Long> {
  List<StudentPayment> findByStudent_StudentIdOrderByCreatedAtDesc(Long studentId);
  long countByStatus(com.SAMS.demo.entity.PaymentStatus status);
}