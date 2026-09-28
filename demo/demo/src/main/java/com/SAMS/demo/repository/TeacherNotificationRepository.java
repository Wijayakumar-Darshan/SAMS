package com.SAMS.demo.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.SAMS.demo.entity.TeacherNotification;

import java.util.List;

public interface TeacherNotificationRepository extends JpaRepository<TeacherNotification, Long> {
  List<TeacherNotification> findByTeacher_TeacherIdOrderByCreatedAtDesc(Long teacherId);
  void deleteAllByTeacher_TeacherId(Long teacherId);

}