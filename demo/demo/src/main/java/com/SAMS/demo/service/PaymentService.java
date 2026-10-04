package com.SAMS.demo.service;

import com.SAMS.demo.entity.PaymentStatus;
import com.SAMS.demo.entity.Student;
import com.SAMS.demo.entity.StudentPayment;
import com.SAMS.demo.entity.Teacher;
import com.SAMS.demo.entity.TeacherPayment;
import com.SAMS.demo.repository.StudentPaymentRepository;
import com.SAMS.demo.repository.StudentRepository;
import com.SAMS.demo.repository.TeacherPaymentRepository;
import com.SAMS.demo.repository.TeacherRepository;
import com.SAMS.demo.storage.PaymentSlipStorageService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
public class PaymentService {

  private static final Logger log =
      LoggerFactory.getLogger(PaymentService.class);

  private final StudentPaymentRepository studentPayRepo;
  private final TeacherPaymentRepository teacherPayRepo;
  private final StudentRepository studentRepo;
  private final TeacherRepository teacherRepo;
  private final NotificationService notificationService;
  private final PaymentSlipStorageService storageService;
  private final ZoneId zoneId;

  public PaymentService(
      StudentPaymentRepository studentPayRepo,
      TeacherPaymentRepository teacherPayRepo,
      StudentRepository studentRepo,
      TeacherRepository teacherRepo,
      NotificationService notificationService,
      PaymentSlipStorageService storageService,
      @Value("${app.timezone}") String timezone
  ) {
    this.studentPayRepo = studentPayRepo;
    this.teacherPayRepo = teacherPayRepo;
    this.studentRepo = studentRepo;
    this.teacherRepo = teacherRepo;
    this.notificationService = notificationService;
    this.storageService = storageService;
    this.zoneId = ZoneId.of(timezone);
  }

  /**
   * Upload a student payment slip to Supabase Storage and
   * save only the object key in Aiven MySQL.
   */
  @Transactional
  public StudentPayment uploadStudentSlip(
      Long studentId,
      MultipartFile file
  ) {
    Student student = studentRepo
        .findById(studentId)
        .orElseThrow(() ->
            new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Student not found"
            )
        );

    /*
     * Uploads to Supabase and returns an object key such as:
     *
     * payments/student/14/UUID.pdf
     */
    String objectKey = storageService.upload(
        file,
        "student",
        studentId
    );

    try {
      StudentPayment payment = new StudentPayment();

      payment.setStudent(student);
      payment.setProofPath(objectKey);
      payment.setStatus(PaymentStatus.PENDING);
      payment.setCreatedAt(Instant.now());

      /*
       * saveAndFlush forces the database operation to happen
       * here so a database error can be caught and the uploaded
       * Supabase object can be removed.
       */
      StudentPayment saved =
          studentPayRepo.saveAndFlush(payment);

      notificationService.notifyStudent(
          student,
          "Payment slip uploaded. Waiting for admin approval."
      );

      return saved;
    } catch (RuntimeException exception) {
      deleteUploadedObjectQuietly(objectKey);
      throw exception;
    }
  }

  /**
   * Upload a teacher payment slip to Supabase Storage and
   * save only the object key in Aiven MySQL.
   */
  @Transactional
  public TeacherPayment uploadTeacherSlip(
      Long teacherId,
      MultipartFile file
  ) {
    Teacher teacher = teacherRepo
        .findById(teacherId)
        .orElseThrow(() ->
            new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Teacher not found"
            )
        );

    /*
     * Uploads to Supabase and returns an object key such as:
     *
     * payments/teacher/8/UUID.jpg
     */
    String objectKey = storageService.upload(
        file,
        "teacher",
        teacherId
    );

    try {
      TeacherPayment payment = new TeacherPayment();

      payment.setTeacher(teacher);
      payment.setProofPath(objectKey);
      payment.setStatus(PaymentStatus.PENDING);
      payment.setCreatedAt(Instant.now());

      TeacherPayment saved =
          teacherPayRepo.saveAndFlush(payment);

      notificationService.notifyTeacher(
          teacher,
          "Payment slip uploaded. Waiting for admin approval."
      );

      return saved;
    } catch (RuntimeException exception) {
      deleteUploadedObjectQuietly(objectKey);
      throw exception;
    }
  }

  /**
   * Apply the existing 30-day subscription approval rule.
   */
  public LocalDate applyApprovalExpiryRule(
      LocalDate currentExpiry
  ) {
    LocalDate today = LocalDate.now(zoneId);

    if (
        currentExpiry == null ||
        currentExpiry.isBefore(today)
    ) {
      return today.plusDays(30);
    }

    return currentExpiry.plusDays(30);
  }

  /**
   * Best-effort cleanup if saving the database payment record
   * fails after the file has already been uploaded.
   */
  private void deleteUploadedObjectQuietly(
      String objectKey
  ) {
    try {
      storageService.delete(objectKey);
    } catch (RuntimeException cleanupException) {
      /*
       * Keep the original database error.
       * Log the cleanup error for later investigation.
       */
      log.error(
          "Could not delete orphaned payment-slip object: {}",
          objectKey,
          cleanupException
      );
    }
  }
}