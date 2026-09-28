package com.SAMS.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.SAMS.demo.entity.Activity;

import java.time.LocalDate;
import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
  List<Activity> findByStudent_StudentIdOrderByStartDateDescStartTimeDesc(Long studentId);
  List<Activity> findByStudent_StudentIdAndStartDateBetween(Long studentId, LocalDate from, LocalDate to);
  void deleteAllByStudent_StudentId(Long studentId);

}