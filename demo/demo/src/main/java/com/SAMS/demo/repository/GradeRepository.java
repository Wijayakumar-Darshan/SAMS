package com.SAMS.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.SAMS.demo.entity.Grade;

import java.util.List;

public interface GradeRepository extends JpaRepository<Grade, Long> {
  List<Grade> findBySchool_Id(Long schoolId);
}