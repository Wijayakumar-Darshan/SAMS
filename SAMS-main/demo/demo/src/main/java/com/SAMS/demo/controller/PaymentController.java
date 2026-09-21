package com.SAMS.demo.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.SAMS.demo.entity.*;
import com.SAMS.demo.repository.*;
import com.SAMS.demo.security.AuthUser;
import com.SAMS.demo.service.PaymentService;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

  private final PaymentService paymentService;
  private final StudentPaymentRepository studentPayRepo;
  private final TeacherPaymentRepository teacherPayRepo;
  private final StudentRepository studentRepo;
  private final TeacherRepository teacherRepo;

  public PaymentController(PaymentService paymentService,
                           StudentPaymentRepository studentPayRepo,
                           TeacherPaymentRepository teacherPayRepo,
                           StudentRepository studentRepo,
                           TeacherRepository teacherRepo) {
    this.paymentService = paymentService;
    this.studentPayRepo = studentPayRepo;
    this.teacherPayRepo = teacherPayRepo;
    this.studentRepo = studentRepo;
    this.teacherRepo = teacherRepo;
  }

  private AuthUser user(Authentication auth) {
    return (AuthUser) auth.getPrincipal();
  }

  @PostMapping(value = "/student/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public Map<String, Object> uploadStudent(Authentication auth, @RequestPart("file") MultipartFile file) {
    if (user(auth).role() != UserRole.STUDENT) throw new SecurityException("Forbidden");
    var saved = paymentService.uploadStudentSlip(user(auth).userId(), file);
    return Map.of("message", "Uploaded", "paymentId", saved.getId());
  }

  @PostMapping(value = "/teacher/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public Map<String, Object> uploadTeacher(Authentication auth, @RequestPart("file") MultipartFile file) {
    if (user(auth).role() != UserRole.TEACHER) throw new SecurityException("Forbidden");
    var saved = paymentService.uploadTeacherSlip(user(auth).userId(), file);
    return Map.of("message", "Uploaded", "paymentId", saved.getId());
  }

  @GetMapping("/student/history")
  public List<Map<String, Object>> studentHistory(Authentication auth) {
    if (user(auth).role() != UserRole.STUDENT) throw new SecurityException("Forbidden");
    Long studentId = user(auth).userId();
    return studentPayRepo.findByStudent_StudentIdOrderByCreatedAtDesc(studentId)
        .stream().map(p -> Map.<String, Object>of(
            "id", p.getId(),
            "status", p.getStatus().name(),
            "createdAt", p.getCreatedAt().toString(),
            "verifiedBy", p.getVerifiedBy(),
            "verifiedAt", p.getVerifiedAt() == null ? null : p.getVerifiedAt().toString()
        )).toList();
  }

  @GetMapping("/teacher/history")
  public List<Map<String, Object>> teacherHistory(Authentication auth) {
    if (user(auth).role() != UserRole.TEACHER) throw new SecurityException("Forbidden");
    Long teacherId = user(auth).userId();
    return teacherPayRepo.findByTeacher_TeacherIdOrderByCreatedAtDesc(teacherId)
        .stream().map(p -> Map.<String, Object>of(
            "id", p.getId(),
            "status", p.getStatus().name(),
            "createdAt", p.getCreatedAt().toString(),
            "verifiedBy", p.getVerifiedBy(),
            "verifiedAt", p.getVerifiedAt() == null ? null : p.getVerifiedAt().toString()
        )).toList();
  }

  /**
   * Admin can view evidence. Student/Teacher can view only their own evidence.
   */
  @GetMapping("/student/{paymentId}/evidence")
  public ResponseEntity<Resource> studentEvidence(Authentication auth, @PathVariable Long paymentId) {
    var u = user(auth);
    StudentPayment p = studentPayRepo.findById(paymentId).orElseThrow();

    boolean allowed = (u.role() == UserRole.ADMIN)
        || (u.role() == UserRole.STUDENT && p.getStudent().getStudentId().equals(u.userId()));
    if (!allowed) throw new SecurityException("Forbidden");

    Path file = paymentService.resolveStoredPath(p.getProofPath());
    Resource res = new FileSystemResource(file);
    return ResponseEntity.ok()
        .contentType(guessContentType(file.toString()))
        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFileName() + "\"")
        .body(res);
  }

  @GetMapping("/teacher/{paymentId}/evidence")
  public ResponseEntity<Resource> teacherEvidence(Authentication auth, @PathVariable Long paymentId) {
    var u = user(auth);
    TeacherPayment p = teacherPayRepo.findById(paymentId).orElseThrow();

    boolean allowed = (u.role() == UserRole.ADMIN)
        || (u.role() == UserRole.TEACHER && p.getTeacher().getTeacherId().equals(u.userId()));
    if (!allowed) throw new SecurityException("Forbidden");

    Path file = paymentService.resolveStoredPath(p.getProofPath());
    Resource res = new FileSystemResource(file);
    return ResponseEntity.ok()
        .contentType(guessContentType(file.toString()))
        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFileName() + "\"")
        .body(res);
  }

  private MediaType guessContentType(String path) {
    String p = path.toLowerCase();
    if (p.endsWith(".pdf")) return MediaType.APPLICATION_PDF;
    if (p.endsWith(".png")) return MediaType.IMAGE_PNG;
    return MediaType.IMAGE_JPEG;
  }
}