package com.SAMS.demo.controller;

import com.SAMS.demo.entity.*;
import com.SAMS.demo.repository.*;
import com.SAMS.demo.security.AuthUser;
import com.SAMS.demo.service.PaymentService;

import jakarta.transaction.Transactional;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
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

  public PaymentController(
      PaymentService paymentService,
      StudentPaymentRepository studentPayRepo,
      TeacherPaymentRepository teacherPayRepo,
      StudentRepository studentRepo,
      TeacherRepository teacherRepo
  ) {
    this.paymentService = paymentService;
    this.studentPayRepo = studentPayRepo;
    this.teacherPayRepo = teacherPayRepo;
    this.studentRepo = studentRepo;
    this.teacherRepo = teacherRepo;
  }

  private AuthUser user(Authentication auth) {
    return (AuthUser) auth.getPrincipal();
  }

  private void requireRole(Authentication auth, UserRole role) {
    if (user(auth).role() != role) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
    }
  }

  /* =========================
     Upload
     ========================= */

  @PostMapping(value = "/student/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public Map<String, Object> uploadStudent(Authentication auth, @RequestPart("file") MultipartFile file) {
    requireRole(auth, UserRole.STUDENT);
    var saved = paymentService.uploadStudentSlip(user(auth).userId(), file);

    Map<String, Object> m = new LinkedHashMap<>();
    m.put("message", "Uploaded");
    m.put("paymentId", saved.getId());
    return m;
  }

  @PostMapping(value = "/teacher/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public Map<String, Object> uploadTeacher(Authentication auth, @RequestPart("file") MultipartFile file) {
    requireRole(auth, UserRole.TEACHER);
    var saved = paymentService.uploadTeacherSlip(user(auth).userId(), file);

    Map<String, Object> m = new LinkedHashMap<>();
    m.put("message", "Uploaded");
    m.put("paymentId", saved.getId());
    return m;
  }

  /* =========================
     History (FIXED: null-safe maps)
     ========================= */

  @org.springframework.transaction.annotation.Transactional(readOnly = true)
  @GetMapping("/student/history")
  public List<Map<String, Object>> studentHistory(Authentication auth) {
    requireRole(auth, UserRole.STUDENT);

    Long studentId = user(auth).userId();

    return studentPayRepo
        .findByStudent_StudentIdOrderByCreatedAtDesc(studentId)
        .stream()
        .map(p -> {
          Map<String, Object> m = new LinkedHashMap<>();
          m.put("paymentId", p.getId()); // better name
          m.put("id", p.getId());        // keep backward compat if frontend expects "id"
          m.put("status", p.getStatus() == null ? null : p.getStatus().name());
          m.put("createdAt", p.getCreatedAt() == null ? null : p.getCreatedAt().toString());
          m.put("verifiedBy", p.getVerifiedBy()); // may be null -> OK now
          m.put("verifiedAt", p.getVerifiedAt() == null ? null : p.getVerifiedAt().toString());
          return m;
        })
        .toList();
  }

  @org.springframework.transaction.annotation.Transactional(readOnly = true)
  @GetMapping("/teacher/history")
  public List<Map<String, Object>> teacherHistory(Authentication auth) {
    requireRole(auth, UserRole.TEACHER);

    Long teacherId = user(auth).userId();

    return teacherPayRepo
        .findByTeacher_TeacherIdOrderByCreatedAtDesc(teacherId)
        .stream()
        .map(p -> {
          Map<String, Object> m = new LinkedHashMap<>();
          m.put("paymentId", p.getId());
          m.put("id", p.getId());
          m.put("status", p.getStatus() == null ? null : p.getStatus().name());
          m.put("createdAt", p.getCreatedAt() == null ? null : p.getCreatedAt().toString());
          m.put("verifiedBy", p.getVerifiedBy());
          m.put("verifiedAt", p.getVerifiedAt() == null ? null : p.getVerifiedAt().toString());
          return m;
        })
        .toList();
  }

  /* =========================
     Evidence (Admin can view; Student/Teacher can view own)
     ========================= */

  @org.springframework.transaction.annotation.Transactional(readOnly = true)
  @GetMapping("/student/{paymentId}/evidence")
  public ResponseEntity<Resource> studentEvidence(Authentication auth, @PathVariable Long paymentId) {
    AuthUser u = user(auth);

    StudentPayment p = studentPayRepo.findById(paymentId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

    boolean allowed =
        (u.role() == UserRole.ADMIN) ||
        (u.role() == UserRole.STUDENT && p.getStudent() != null && p.getStudent().getStudentId().equals(u.userId()));

    if (!allowed) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");

    if (p.getProofPath() == null || p.getProofPath().isBlank()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Evidence file not found");
    }

    Path file = paymentService.resolveStoredPath(p.getProofPath());
    if (!Files.exists(file)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Evidence file not found");
    }

    Resource res = new FileSystemResource(file);

    return ResponseEntity.ok()
        .contentType(guessContentType(file))
        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFileName() + "\"")
        .body(res);
  }

  @org.springframework.transaction.annotation.Transactional(readOnly = true)
  @GetMapping("/teacher/{paymentId}/evidence")
  public ResponseEntity<Resource> teacherEvidence(Authentication auth, @PathVariable Long paymentId) {
    AuthUser u = user(auth);

    TeacherPayment p = teacherPayRepo.findById(paymentId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

    boolean allowed =
        (u.role() == UserRole.ADMIN) ||
        (u.role() == UserRole.TEACHER && p.getTeacher() != null && p.getTeacher().getTeacherId().equals(u.userId()));

    if (!allowed) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");

    if (p.getProofPath() == null || p.getProofPath().isBlank()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Evidence file not found");
    }

    Path file = paymentService.resolveStoredPath(p.getProofPath());
    if (!Files.exists(file)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Evidence file not found");
    }

    Resource res = new FileSystemResource(file);

    return ResponseEntity.ok()
        .contentType(guessContentType(file))
        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFileName() + "\"")
        .body(res);
  }

  private MediaType guessContentType(Path file) {
    try {
      String ct = Files.probeContentType(file);
      if (ct != null) return MediaType.parseMediaType(ct);
    } catch (Exception ignored) {}
    // fallback
    String p = file.toString().toLowerCase();
    if (p.endsWith(".pdf")) return MediaType.APPLICATION_PDF;
    if (p.endsWith(".png")) return MediaType.IMAGE_PNG;
    if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return MediaType.IMAGE_JPEG;
    return MediaType.APPLICATION_OCTET_STREAM;
  }
}