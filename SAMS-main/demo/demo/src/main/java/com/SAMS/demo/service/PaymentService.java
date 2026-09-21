package com.SAMS.demo.service;

import com.SAMS.demo.entity.*;
import com.SAMS.demo.repository.StudentPaymentRepository;
import com.SAMS.demo.repository.StudentRepository;
import com.SAMS.demo.repository.TeacherPaymentRepository;
import com.SAMS.demo.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.*;
import java.time.*;
import java.util.Set;
import java.util.UUID;

@Service
public class PaymentService {

  private final StudentPaymentRepository studentPayRepo;
  private final TeacherPaymentRepository teacherPayRepo;
  private final StudentRepository studentRepo;
  private final TeacherRepository teacherRepo;
  private final NotificationService notificationService;
  private final ZoneId zoneId;
  private final Path uploadsDir;

  private static final Set<String> ALLOWED = Set.of(
      "image/jpeg", "image/png", "application/pdf"
  );

  public PaymentService(StudentPaymentRepository studentPayRepo,
                        TeacherPaymentRepository teacherPayRepo,
                        StudentRepository studentRepo,
                        TeacherRepository teacherRepo,
                        NotificationService notificationService,
                        @Value("${app.timezone}") String timezone,
                        @Value("${app.uploadsDir}") String uploadsDir) {
    this.studentPayRepo = studentPayRepo;
    this.teacherPayRepo = teacherPayRepo;
    this.studentRepo = studentRepo;
    this.teacherRepo = teacherRepo;
    this.notificationService = notificationService;
    this.zoneId = ZoneId.of(timezone);
    this.uploadsDir = Paths.get(uploadsDir).toAbsolutePath().normalize();
  }

  public StudentPayment uploadStudentSlip(Long studentId, MultipartFile file) {
    Student student = studentRepo.findById(studentId).orElseThrow();
    String stored = storeFile("student", studentId, file);

    StudentPayment p = new StudentPayment();
    p.setStudent(student);
    p.setProofPath(stored);
    p.setStatus(PaymentStatus.PENDING);
    p.setCreatedAt(Instant.now());
    StudentPayment saved = studentPayRepo.save(p);

    notificationService.notifyStudent(student, "Payment slip uploaded. Waiting for admin approval.");
    return saved;
  }

  public TeacherPayment uploadTeacherSlip(Long teacherId, MultipartFile file) {
    Teacher teacher = teacherRepo.findById(teacherId).orElseThrow();
    String stored = storeFile("teacher", teacherId, file);

    TeacherPayment p = new TeacherPayment();
    p.setTeacher(teacher);
    p.setProofPath(stored);
    p.setStatus(PaymentStatus.PENDING);
    p.setCreatedAt(Instant.now());
    TeacherPayment saved = teacherPayRepo.save(p);

    notificationService.notifyTeacher(teacher, "Payment slip uploaded. Waiting for admin approval.");
    return saved;
  }

  public LocalDate applyApprovalExpiryRule(LocalDate currentExp) {
    LocalDate today = LocalDate.now(zoneId);
    if (currentExp == null || currentExp.isBefore(today)) {
      return today.plusDays(30);
    }
    return currentExp.plusDays(30);
  }

  private String storeFile(String type, Long ownerId, MultipartFile file) {
    if (file == null || file.isEmpty()) throw new IllegalArgumentException("File is required");
    if (file.getSize() > 10L * 1024 * 1024) throw new IllegalArgumentException("File too large (max 10MB)");

    String contentType = file.getContentType();
    if (contentType == null || !ALLOWED.contains(contentType)) {
      throw new IllegalArgumentException("Only JPG, PNG or PDF allowed");
    }

    String ext = switch (contentType) {
      case "image/jpeg" -> ".jpg";
      case "image/png" -> ".png";
      case "application/pdf" -> ".pdf";
      default -> "";
    };

    String original = StringUtils.cleanPath(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
    String name = UUID.randomUUID() + "_" + original.replaceAll("[^a-zA-Z0-9._-]", "_") + ext;

    try {
      Path dir = uploadsDir.resolve(type).resolve(String.valueOf(ownerId));
      Files.createDirectories(dir);
      Path target = dir.resolve(name);

      try (InputStream in = file.getInputStream()) {
        Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
      }
      // store relative path
      return uploadsDir.relativize(target).toString().replace("\\", "/");
    } catch (Exception e) {
      throw new RuntimeException("Failed to store file");
    }
  }

  public Path resolveStoredPath(String proofPath) {
    Path p = uploadsDir.resolve(proofPath).normalize().toAbsolutePath();
    if (!p.startsWith(uploadsDir)) throw new IllegalArgumentException("Invalid path");
    return p;
  }
}
