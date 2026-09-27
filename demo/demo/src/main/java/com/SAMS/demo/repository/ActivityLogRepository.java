package com.SAMS.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.SAMS.demo.entity.ActivityLog;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
  Optional<ActivityLog> findByStudent_StudentIdAndWeekStart(Long studentId, LocalDate weekStart);
  List<ActivityLog> findByStudent_StudentIdOrderByWeekStartAsc(Long studentId);
}