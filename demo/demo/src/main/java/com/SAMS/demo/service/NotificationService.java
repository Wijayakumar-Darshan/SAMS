package com.SAMS.demo.service;

import com.SAMS.demo.entity.*;
import com.SAMS.demo.repository.StudentNotificationRepository;
import com.SAMS.demo.repository.TeacherNotificationRepository;
import com.SAMS.demo.websocket.NotificationWebSocketHandler;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
public class NotificationService {

  private final StudentNotificationRepository studentRepo;
  private final TeacherNotificationRepository teacherRepo;
  private final NotificationWebSocketHandler ws;

  public NotificationService(StudentNotificationRepository studentRepo,
                             TeacherNotificationRepository teacherRepo,
                             NotificationWebSocketHandler ws) {
    this.studentRepo = studentRepo;
    this.teacherRepo = teacherRepo;
    this.ws = ws;
  }

  public StudentNotification notifyStudent(Student student, String message) {
    StudentNotification n = new StudentNotification();
    n.setStudent(student);
    n.setMessage(message);
    n.setRead(false);
    n.setCreatedAt(Instant.now());
    StudentNotification saved = studentRepo.save(n);

    ws.push(UserRole.STUDENT.name(), student.getStudentId(), Map.of(
        "type", "STUDENT_NOTIFICATION",
        "id", saved.getId(),
        "message", saved.getMessage(),
        "createdAt", saved.getCreatedAt().toString()
    ));
    return saved;
  }

  public TeacherNotification notifyTeacher(Teacher teacher, String message) {
    TeacherNotification n = new TeacherNotification();
    n.setTeacher(teacher);
    n.setMessage(message);
    n.setRead(false);
    n.setCreatedAt(Instant.now());
    TeacherNotification saved = teacherRepo.save(n);

    ws.push(UserRole.TEACHER.name(), teacher.getTeacherId(), Map.of(
        "type", "TEACHER_NOTIFICATION",
        "id", saved.getId(),
        "message", saved.getMessage(),
        "createdAt", saved.getCreatedAt().toString()
    ));
    return saved;
  }
}