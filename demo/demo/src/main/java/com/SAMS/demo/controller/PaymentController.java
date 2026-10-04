package com.SAMS.demo.controller;

import com.SAMS.demo.entity.StudentPayment;
import com.SAMS.demo.entity.TeacherPayment;
import com.SAMS.demo.entity.UserRole;
import com.SAMS.demo.repository.StudentPaymentRepository;
import com.SAMS.demo.repository.TeacherPaymentRepository;
import com.SAMS.demo.security.AuthUser;
import com.SAMS.demo.service.PaymentService;
import com.SAMS.demo.storage.PaymentSlipStorageService;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

  private final PaymentService paymentService;
  private final PaymentSlipStorageService storageService;
  private final StudentPaymentRepository studentPayRepo;
  private final TeacherPaymentRepository teacherPayRepo;

  public PaymentController(
      PaymentService paymentService,
      PaymentSlipStorageService storageService,
      StudentPaymentRepository studentPayRepo,
      TeacherPaymentRepository teacherPayRepo
  ) {
    this.paymentService = paymentService;
    this.storageService = storageService;
    this.studentPayRepo = studentPayRepo;
    this.teacherPayRepo = teacherPayRepo;
  }

  private AuthUser user(Authentication auth) {
    if (auth == null || !(auth.getPrincipal() instanceof AuthUser authUser)) {
      throw new ResponseStatusException(
          HttpStatus.UNAUTHORIZED,
          "Authentication required"
      );
    }

    return authUser;
  }

  private void requireRole(Authentication auth, UserRole requiredRole) {
    if (user(auth).role() != requiredRole) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Forbidden"
      );
    }
  }

  /* ==================================================
     UPLOAD
     Actual Supabase upload happens in PaymentService.
     ================================================== */

  @PostMapping(
      value = "/student/upload",
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE
  )
  public Map<String, Object> uploadStudent(
      Authentication auth,
      @RequestPart("file") MultipartFile file
  ) {
    requireRole(auth, UserRole.STUDENT);

    AuthUser currentUser = user(auth);

    StudentPayment saved = paymentService.uploadStudentSlip(
        currentUser.userId(),
        file
    );

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("message", "Uploaded");
    response.put("paymentId", saved.getId());

    return response;
  }

  @PostMapping(
      value = "/teacher/upload",
      consumes = MediaType.MULTIPART_FORM_DATA_VALUE
  )
  public Map<String, Object> uploadTeacher(
      Authentication auth,
      @RequestPart("file") MultipartFile file
  ) {
    requireRole(auth, UserRole.TEACHER);

    AuthUser currentUser = user(auth);

    TeacherPayment saved = paymentService.uploadTeacherSlip(
        currentUser.userId(),
        file
    );

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("message", "Uploaded");
    response.put("paymentId", saved.getId());

    return response;
  }

  /* ==================================================
     PAYMENT HISTORY
     ================================================== */

  @Transactional(readOnly = true)
  @GetMapping("/student/history")
  public List<Map<String, Object>> studentHistory(
      Authentication auth
  ) {
    requireRole(auth, UserRole.STUDENT);

    Long studentId = user(auth).userId();

    return studentPayRepo
        .findByStudent_StudentIdOrderByCreatedAtDesc(studentId)
        .stream()
        .map(payment -> {
          Map<String, Object> response = new LinkedHashMap<>();

          response.put("paymentId", payment.getId());
          response.put("id", payment.getId());

          response.put(
              "status",
              payment.getStatus() == null
                  ? null
                  : payment.getStatus().name()
          );

          response.put(
              "createdAt",
              payment.getCreatedAt() == null
                  ? null
                  : payment.getCreatedAt().toString()
          );

          response.put(
              "verifiedBy",
              payment.getVerifiedBy()
          );

          response.put(
              "verifiedAt",
              payment.getVerifiedAt() == null
                  ? null
                  : payment.getVerifiedAt().toString()
          );

          return response;
        })
        .toList();
  }

  @Transactional(readOnly = true)
  @GetMapping("/teacher/history")
  public List<Map<String, Object>> teacherHistory(
      Authentication auth
  ) {
    requireRole(auth, UserRole.TEACHER);

    Long teacherId = user(auth).userId();

    return teacherPayRepo
        .findByTeacher_TeacherIdOrderByCreatedAtDesc(teacherId)
        .stream()
        .map(payment -> {
          Map<String, Object> response = new LinkedHashMap<>();

          response.put("paymentId", payment.getId());
          response.put("id", payment.getId());

          response.put(
              "status",
              payment.getStatus() == null
                  ? null
                  : payment.getStatus().name()
          );

          response.put(
              "createdAt",
              payment.getCreatedAt() == null
                  ? null
                  : payment.getCreatedAt().toString()
          );

          response.put(
              "verifiedBy",
              payment.getVerifiedBy()
          );

          response.put(
              "verifiedAt",
              payment.getVerifiedAt() == null
                  ? null
                  : payment.getVerifiedAt().toString()
          );

          return response;
        })
        .toList();
  }

  /* ==================================================
     EVIDENCE URL
     Admin can view any payment.
     Student/Teacher can view only their own payment.

     Response:
     {
       "url": "temporary-supabase-url",
       "expiresInSeconds": 300
     }
     ================================================== */

  @Transactional(readOnly = true)
  @GetMapping("/student/{paymentId}/evidence")
  public ResponseEntity<Map<String, Object>> studentEvidence(
      Authentication auth,
      @PathVariable Long paymentId
  ) {
    AuthUser currentUser = user(auth);

    StudentPayment payment = studentPayRepo
        .findById(paymentId)
        .orElseThrow(() ->
            new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Payment not found"
            )
        );

    boolean isAdmin =
        currentUser.role() == UserRole.ADMIN;

    boolean isOwner =
        currentUser.role() == UserRole.STUDENT
            && payment.getStudent() != null
            && Objects.equals(
                payment.getStudent().getStudentId(),
                currentUser.userId()
            );

    if (!isAdmin && !isOwner) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Forbidden"
      );
    }

    return createEvidenceResponse(payment.getProofPath());
  }

  @Transactional(readOnly = true)
  @GetMapping("/teacher/{paymentId}/evidence")
  public ResponseEntity<Map<String, Object>> teacherEvidence(
      Authentication auth,
      @PathVariable Long paymentId
  ) {
    AuthUser currentUser = user(auth);

    TeacherPayment payment = teacherPayRepo
        .findById(paymentId)
        .orElseThrow(() ->
            new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Payment not found"
            )
        );

    boolean isAdmin =
        currentUser.role() == UserRole.ADMIN;

    boolean isOwner =
        currentUser.role() == UserRole.TEACHER
            && payment.getTeacher() != null
            && Objects.equals(
                payment.getTeacher().getTeacherId(),
                currentUser.userId()
            );

    if (!isAdmin && !isOwner) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN,
          "Forbidden"
      );
    }

    return createEvidenceResponse(payment.getProofPath());
  }

  private ResponseEntity<Map<String, Object>> createEvidenceResponse(
      String objectKey
  ) {
    if (objectKey == null || objectKey.isBlank()) {
      throw new ResponseStatusException(
          HttpStatus.NOT_FOUND,
          "Evidence file not found"
      );
    }

    /*
     * The database now contains a Supabase object key,
     * for example:
     *
     * payments/student/14/UUID.pdf
     */
    if (
        objectKey.startsWith("./uploads")
            || objectKey.startsWith("uploads/")
            || objectKey.contains(":\\")
    ) {
      throw new ResponseStatusException(
          HttpStatus.NOT_FOUND,
          "This payment references an old local evidence file"
      );
    }

    try {
      String signedUrl =
          storageService.createTemporaryViewUrl(objectKey);

      Map<String, Object> response = new LinkedHashMap<>();
      response.put("url", signedUrl);
      response.put("expiresInSeconds", 300);

      return ResponseEntity
          .ok()
          .cacheControl(CacheControl.noStore())
          .body(response);

    } catch (IllegalArgumentException exception) {
      throw new ResponseStatusException(
          HttpStatus.NOT_FOUND,
          exception.getMessage(),
          exception
      );

    } catch (RuntimeException exception) {
      throw new ResponseStatusException(
          HttpStatus.BAD_GATEWAY,
          "Could not access payment evidence",
          exception
      );
    }
  }
}