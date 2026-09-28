package com.SAMS.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.SAMS.demo.entity.SchoolClass;

import java.util.List;

public interface SchoolClassRepository extends JpaRepository<SchoolClass, Long> {
  List<SchoolClass> findByGrade_Id(Long gradeId);
  List<SchoolClass> findByTeacher_TeacherId(Long teacherId);
}