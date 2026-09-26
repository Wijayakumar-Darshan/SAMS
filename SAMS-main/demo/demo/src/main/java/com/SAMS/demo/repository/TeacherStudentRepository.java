package com.SAMS.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.SAMS.demo.entity.TeacherStudent;

import java.util.List;
import java.util.Optional;

public interface TeacherStudentRepository extends JpaRepository<TeacherStudent, Long> {
  boolean existsByTeacher_TeacherIdAndStudent_StudentId(Long teacherId, Long studentId);
  Optional<TeacherStudent> findByTeacher_TeacherIdAndStudent_StudentId(Long teacherId, Long studentId);
  List<TeacherStudent> findByTeacher_TeacherId(Long teacherId);
  List<TeacherStudent> findByStudent_StudentId(Long studentId);
  @Query("select ts.student.studentId from TeacherStudent ts where ts.teacher.teacherId = :teacherId")
  List<Long> findStudentIdsByTeacherId(@Param("teacherId") Long teacherId);
  Optional<TeacherStudent> findFirstByStudent_StudentIdOrderByLinkedAtDesc(Long studentId);
}