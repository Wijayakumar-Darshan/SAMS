package com.SAMS.demo.controller;

import com.SAMS.demo.entity.*;
import com.SAMS.demo.repository.*;
import com.SAMS.demo.service.NotificationService;
import com.SAMS.demo.service.PaymentService;
import com.SAMS.demo.security.AuthUser;
import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

  private final TeacherRepository teacherRepo;
  private final StudentRepository studentRepo;
  private final SchoolRepository schoolRepo;
  private final GradeRepository gradeRepo;
  private final SchoolClassRepository classRepo;
  private final StudentPaymentRepository studentPayRepo;
  private final TeacherPaymentRepository teacherPayRepo;

  private final PaymentService paymentService;
  private final NotificationService notificationService;
  private final BCryptPasswordEncoder encoder;
  private final ZoneId zoneId;
  private final SecureRandom random = new SecureRandom();

  public AdminController(TeacherRepository teacherRepo,
                         StudentRepository studentRepo,
                         SchoolRepository schoolRepo,
                         GradeRepository gradeRepo,
                         SchoolClassRepository classRepo,
                         StudentPaymentRepository studentPayRepo,
                         TeacherPaymentRepository teacherPayRepo,
                         PaymentService paymentService,
                         NotificationService notificationService,
                         BCryptPasswordEncoder encoder,
                         @Value("${app.timezone}") String timezone) {
    this.teacherRepo = teacherRepo;
    this.studentRepo = studentRepo;
    this.schoolRepo = schoolRepo;
    this.gradeRepo = gradeRepo;
    this.classRepo = classRepo;
    this.studentPayRepo = studentPayRepo;
    this.teacherPayRepo = teacherPayRepo;
    this.paymentService = paymentService;
    this.notificationService = notificationService;
    this.encoder = encoder;
    this.zoneId = ZoneId.of(timezone);
  }

  private String adminEmail(Authentication auth) {
    return ((AuthUser) auth.getPrincipal()).email();
  }

  @GetMapping("/dashboard")
  public Map<String, Object> dashboard() {
    long sp = studentPayRepo.countByStatus(PaymentStatus.PENDING);
    long tp = teacherPayRepo.countByStatus(PaymentStatus.PENDING);
    // Added real counts (previously missing) so the admin dashboard can show
    // total teachers/students/schools without inventing any numbers.
    LocalDate today = LocalDate.now(zoneId);
    long activeTeachers = teacherRepo.findAll().stream()
        .filter(t -> t.getTierExpDate() != null && !t.getTierExpDate().isBefore(today))
        .count();
    long activeStudents = studentRepo.findAll().stream()
        .filter(s -> s.getTierExpDate() != null && !s.getTierExpDate().isBefore(today))
        .count();
    return Map.of(
        "pendingStudentPayments", sp,
        "pendingTeacherPayments", tp,
        "totalTeachers", teacherRepo.count(),
        "totalStudents", studentRepo.count(),
        "totalSchools", schoolRepo.count(),
        "activeTeacherSubscriptions", activeTeachers,
        "activeStudentSubscriptions", activeStudents
    );
  }

  // Added so the admin UI can list existing teachers (previously there was no way to view them).
  @GetMapping("/teachers")
  public List<Map<String, Object>> listTeachers() {
    return teacherRepo.findAll().stream()
        .map(t -> {
          Map<String, Object> m = new java.util.LinkedHashMap<>();
          m.put("teacherId", t.getTeacherId());
          m.put("name", t.getName());
          m.put("email", t.getEmail());
          m.put("school", t.getSchool());
          m.put("grade", t.getGrade());
          m.put("className", t.getClassName());
          m.put("mappingCode", t.getMappingCode());
          m.put("tierExpDate", String.valueOf(t.getTierExpDate()));
          m.put("passwordSet", t.isPasswordSet());
          return m;
        })
        .toList();
  }

  // =========================
  // TEACHERS
  // =========================

  public record CreateTeacherReq(
      @NotBlank String name,
      @NotBlank String school,
      @NotBlank String grade,
      @NotBlank String className,
      @Email @NotBlank String email,
      String otp // optional
  ) {}

  @PostMapping("/teachers")
  public Map<String, Object> createTeacher(@RequestBody CreateTeacherReq req) {
    if (teacherRepo.existsByEmail(req.email().toLowerCase().trim())) {
      throw new IllegalArgumentException("Email already exists");
    }

    Teacher t = new Teacher();
    t.setName(req.name().trim());
    t.setSchool(req.school().trim());
    t.setGrade(req.grade().trim());
    t.setClassName(req.className().trim());
    t.setEmail(req.email().toLowerCase().trim());

    String otp = (req.otp() != null && req.otp().matches("\\d{6}")) ? req.otp() : generateUniqueOtp();
    t.setOtp(otp);

    t.setMappingCode(generateUniqueMappingCode());
    t.setPassword(null);
    t.setPasswordSet(false);

    LocalDate today = LocalDate.now(zoneId);
    t.setTierExpDate(today.plusDays(21));

    teacherRepo.save(t);

    return Map.of(
        "message", "Teacher created",
        "teacherId", t.getTeacherId(),
        "otp", t.getOtp(),
        "mappingCode", t.getMappingCode(),
        "trialExpDate", String.valueOf(t.getTierExpDate())
    );
  }

  @PostMapping("/teachers/{teacherId}/regenerate-otp")
  public Map<String, Object> regenerateOtp(@PathVariable Long teacherId) {
    Teacher t = teacherRepo.findById(teacherId).orElseThrow();
    t.setOtp(generateUniqueOtp());
    t.setPasswordSet(false);
    t.setPassword(null);
    teacherRepo.save(t);
    return Map.of("message", "OTP regenerated", "otp", t.getOtp());
  }

  // =========================
  // SCHOOL STRUCTURE
  // =========================

  public record SchoolReq(@NotBlank String name) {}
  @PostMapping("/schools")
  public School createSchool(@RequestBody SchoolReq req) {
    School s = new School();
    s.setName(req.name().trim());
    return schoolRepo.save(s);
  }

  @GetMapping("/schools")
  public List<School> schools() { return schoolRepo.findAll(); }

  public record GradeReq(@NotBlank String name, @NotNull Long schoolId) {}
  @PostMapping("/grades")
  public Grade createGrade(@RequestBody GradeReq req) {
    School school = schoolRepo.findById(req.schoolId()).orElseThrow();
    Grade g = new Grade();
    g.setName(req.name().trim());
    g.setSchool(school);
    return gradeRepo.save(g);
  }

  @GetMapping("/grades")
  public List<Grade> grades(@RequestParam Long schoolId) {
    return gradeRepo.findBySchool_Id(schoolId);
  }

  public record ClassReq(@NotBlank String name, @NotNull Long gradeId, Long teacherId) {}
  @PostMapping("/classes")
  public SchoolClass createClass(@RequestBody ClassReq req) {
    Grade grade = gradeRepo.findById(req.gradeId()).orElseThrow();
    SchoolClass c = new SchoolClass();
    c.setName(req.name().trim());
    c.setGrade(grade);
    if (req.teacherId() != null) {
      Teacher t = teacherRepo.findById(req.teacherId()).orElseThrow();
      c.setTeacher(t);
    }
    return classRepo.save(c);
  }

  @GetMapping("/classes")
  public List<SchoolClass> classes(@RequestParam Long gradeId) {
    return classRepo.findByGrade_Id(gradeId);
  }

  @PutMapping("/classes/{classId}/assign-teacher/{teacherId}")
  public Map<String, Object> assignClassTeacher(@PathVariable Long classId, @PathVariable Long teacherId) {
    SchoolClass c = classRepo.findById(classId).orElseThrow();
    Teacher t = teacherRepo.findById(teacherId).orElseThrow();
    c.setTeacher(t);
    classRepo.save(c);
    return Map.of("message", "Assigned");
  }

  // =========================
  // PAYMENTS TABLES (two separate)
  // WhatsApp update: include student email and teacher email.
  // =========================

  @GetMapping("/payments/students")
  public List<Map<String, Object>> studentPayments() {
    return studentPayRepo.findAll().stream().map(p -> Map.<String, Object>of(
        "paymentId", p.getId(),
        "studentId", p.getStudent().getStudentId(),
        "studentName", p.getStudent().getName(),
        "studentEmail", p.getStudent().getEmail(),
        "trialExpDate", String.valueOf(p.getStudent().getTierExpDate()),
        "status", p.getStatus().name(),
        "createdAt", p.getCreatedAt().toString()
    )).toList();
  }

  @GetMapping("/payments/teachers")
  public List<Map<String, Object>> teacherPayments() {
    return teacherPayRepo.findAll().stream().map(p -> Map.<String, Object>of(
        "paymentId", p.getId(),
        "teacherId", p.getTeacher().getTeacherId(),
        "teacherName", p.getTeacher().getName(),
        "teacherEmail", p.getTeacher().getEmail(),
        "trialExpDate", String.valueOf(p.getTeacher().getTierExpDate()),
        "status", p.getStatus().name(),
        "createdAt", p.getCreatedAt().toString()
    )).toList();
  }

  public record ApproveReq(Integer extendMonths) {}

  @PostMapping("/payments/students/{paymentId}/approve")
  public Map<String, Object> approveStudent(Authentication auth, @PathVariable Long paymentId, @RequestBody(required = false) ApproveReq req) {
    StudentPayment p = studentPayRepo.findById(paymentId).orElseThrow();
    Student s = p.getStudent();

    p.setStatus(PaymentStatus.APPROVED);
    p.setVerifiedBy(adminEmail(auth));
    p.setVerifiedAt(Instant.now());
    studentPayRepo.save(p);

    LocalDate newExp = paymentService.applyApprovalExpiryRule(s.getTierExpDate());
    if (req != null && req.extendMonths() != null && req.extendMonths() != 0) {
      newExp = newExp.plusMonths(req.extendMonths());
    }
    s.setTierExpDate(newExp);
    studentRepo.save(s);

    // WhatsApp update: success notification to student
    notificationService.notifyStudent(s, "Payment approved successfully. Your expiry date is now " + newExp + ".");

    return Map.of("message", "Approved", "newExpiry", String.valueOf(newExp));
  }

  public record RejectReq(@NotBlank String reason) {}

  @PostMapping("/payments/students/{paymentId}/reject")
  public Map<String, Object> rejectStudent(Authentication auth, @PathVariable Long paymentId, @RequestBody RejectReq req) {
    StudentPayment p = studentPayRepo.findById(paymentId).orElseThrow();
    Student s = p.getStudent();

    p.setStatus(PaymentStatus.REJECTED);
    p.setVerifiedBy(adminEmail(auth));
    p.setVerifiedAt(Instant.now());
    studentPayRepo.save(p);

    // WhatsApp update: detailed issue message
    notificationService.notifyStudent(s, "Payment rejected. Issue: " + req.reason());

    return Map.of("message", "Rejected");
  }

  @PostMapping("/payments/teachers/{paymentId}/approve")
  public Map<String, Object> approveTeacher(Authentication auth, @PathVariable Long paymentId, @RequestBody(required = false) ApproveReq req) {
    TeacherPayment p = teacherPayRepo.findById(paymentId).orElseThrow();
    Teacher t = p.getTeacher();

    p.setStatus(PaymentStatus.APPROVED);
    p.setVerifiedBy(adminEmail(auth));
    p.setVerifiedAt(Instant.now());
    teacherPayRepo.save(p);

    LocalDate newExp = paymentService.applyApprovalExpiryRule(t.getTierExpDate());
    if (req != null && req.extendMonths() != null && req.extendMonths() != 0) {
      newExp = newExp.plusMonths(req.extendMonths());
    }
    t.setTierExpDate(newExp);
    teacherRepo.save(t);

    notificationService.notifyTeacher(t, "Payment approved successfully. Your expiry date is now " + newExp + ".");
    return Map.of("message", "Approved", "newExpiry", String.valueOf(newExp));
  }

  @PostMapping("/payments/teachers/{paymentId}/reject")
  public Map<String, Object> rejectTeacher(Authentication auth, @PathVariable Long paymentId, @RequestBody RejectReq req) {
    TeacherPayment p = teacherPayRepo.findById(paymentId).orElseThrow();
    Teacher t = p.getTeacher();

    p.setStatus(PaymentStatus.REJECTED);
    p.setVerifiedBy(adminEmail(auth));
    p.setVerifiedAt(Instant.now());
    teacherPayRepo.save(p);

    notificationService.notifyTeacher(t, "Payment rejected. Issue: " + req.reason());
    return Map.of("message", "Rejected");
  }

  /**
   * Admin can extend/reduce expiry by months (positive/negative).
   * new expiry = current expiry + months
   */
  public record ExtendReq(@NotNull Integer months) {}

  @PostMapping("/students/{studentId}/extend-expiry")
  public Map<String, Object> extendStudent(Authentication auth, @PathVariable Long studentId, @RequestBody ExtendReq req) {
    Student s = studentRepo.findById(studentId).orElseThrow();
    if (s.getTierExpDate() == null) s.setTierExpDate(LocalDate.now(zoneId));
    s.setTierExpDate(s.getTierExpDate().plusMonths(req.months()));
    studentRepo.save(s);

    notificationService.notifyStudent(s, "Expiry date updated by admin. New expiry date is " + s.getTierExpDate() + ".");
    return Map.of("message", "Updated", "newExpiry", String.valueOf(s.getTierExpDate()));
  }

  @PostMapping("/teachers/{teacherId}/extend-expiry")
  public Map<String, Object> extendTeacher(Authentication auth, @PathVariable Long teacherId, @RequestBody ExtendReq req) {
    Teacher t = teacherRepo.findById(teacherId).orElseThrow();
    if (t.getTierExpDate() == null) t.setTierExpDate(LocalDate.now(zoneId));
    t.setTierExpDate(t.getTierExpDate().plusMonths(req.months()));
    teacherRepo.save(t);

    notificationService.notifyTeacher(t, "Expiry date updated by admin. New expiry date is " + t.getTierExpDate() + ".");
    return Map.of("message", "Updated", "newExpiry", String.valueOf(t.getTierExpDate()));
  }

  // =========================
  // Helpers
  // =========================
  private String generateUniqueOtp() {
    while (true) {
      String otp = String.format("%06d", random.nextInt(1_000_000));
      if (!teacherRepo.existsByOtp(otp)) return otp;
    }
  }

  private String generateUniqueMappingCode() {
    while (true) {
      String code = "T" + String.format("%06d", random.nextInt(1_000_000));
      if (!teacherRepo.existsByMappingCode(code)) return code;
    }
  }
}
