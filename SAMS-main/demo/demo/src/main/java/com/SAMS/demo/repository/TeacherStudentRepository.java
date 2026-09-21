package com.SAMS.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.SAMS.demo.entity.TeacherStudent;

import java.util.List;
import java.util.Optional;

public interface TeacherStudentRepository extends JpaRepository<TeacherStudent, Long> {
  boolean existsByTeacher_TeacherIdAndStudent_StudentId(Long teacherId, Long studentId);
  Optional<TeacherStudent> findByTeacher_TeacherIdAndStudent_StudentId(Long teacherId, Long studentId);
  List<TeacherStudent> findByTeacher_TeacherId(Long teacherId);
  List<TeacherStudent> findByStudent_StudentId(Long studentId);
}