package com.SAMS.demo.scheduler;

import com.SAMS.demo.entity.*;
import com.SAMS.demo.repository.StudentRepository;
import com.SAMS.demo.repository.TeacherRepository;
import com.SAMS.demo.service.NotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Component
public class ExpiryReminderJob {

  private final StudentRepository studentRepo;
  private final TeacherRepository teacherRepo;
  private final NotificationService notificationService;
  private final ZoneId zoneId;

  public ExpiryReminderJob(StudentRepository studentRepo,
                           TeacherRepository teacherRepo,
                           NotificationService notificationService,
                           @Value("${app.timezone}") String timezone) {
    this.studentRepo = studentRepo;
    this.teacherRepo = teacherRepo;
    this.notificationService = notificationService;
    this.zoneId = ZoneId.of(timezone);
  }

  // Daily 08:00 Asia/Colombo
  @Scheduled(cron = "0 0 8 * * *", zone = "${app.timezone}")
  public void run() {
    LocalDate today = LocalDate.now(zoneId);
    LocalDate target = today.plusDays(3);

    List<Student> students = studentRepo.findAll();
    for (Student s : students) {
      if (s.getTierExpDate() != null && s.getTierExpDate().equals(target)) {
        notificationService.notifyStudent(s, "Reminder: Your trial will expire in 3 days (" + s.getTierExpDate() + ").");
      }
    }

    List<Teacher> teachers = teacherRepo.findAll();
    for (Teacher t : teachers) {
      if (t.getTierExpDate() != null && t.getTierExpDate().equals(target)) {
        notificationService.notifyTeacher(t, "Reminder: Your trial will expire in 3 days (" + t.getTierExpDate() + ").");
      }
    }
  }
}