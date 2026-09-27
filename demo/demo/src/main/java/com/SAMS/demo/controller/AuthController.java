package com.SAMS.demo.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.SAMS.demo.controller.RestExceptionHandler.TrialExpiredException;
import com.SAMS.demo.entity.*;
import com.SAMS.demo.entity.UserType;
import com.SAMS.demo.repository.AdminUserRepository;
import com.SAMS.demo.repository.StudentRepository;
import com.SAMS.demo.repository.TeacherRepository;
import com.SAMS.demo.security.JwtService;
import com.SAMS.demo.security.RefreshTokenService;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final StudentRepository studentRepo;
  private final TeacherRepository teacherRepo;
  private final AdminUserRepository adminRepo;
  private final BCryptPasswordEncoder encoder;
  private final JwtService jwtService;
  private final RefreshTokenService refreshTokenService;
  private final ZoneId zoneId;

  public AuthController(StudentRepository studentRepo,
                        TeacherRepository teacherRepo,
                        AdminUserRepository adminRepo,
                        BCryptPasswordEncoder encoder,
                        JwtService jwtService,
                        RefreshTokenService refreshTokenService,
                        @Value("${app.timezone}") String timezone) {
    this.studentRepo = studentRepo;
    this.teacherRepo = teacherRepo;
    this.adminRepo = adminRepo;
    this.encoder = encoder;
    this.jwtService = jwtService;
    this.refreshTokenService = refreshTokenService;
    this.zoneId = ZoneId.of(timezone);
  }

  // =========================
  // STUDENT REGISTER + LOGIN
  // =========================

  public record StudentRegisterReq(
      @NotBlank String name,
      @Email @NotBlank String email,
      @NotBlank @Size(min = 6) String password,
      @NotBlank String guardianName,
      @NotBlank String school,
      @NotBlank String grade,
      @NotBlank String className
  ) {}

  @PostMapping("/student/register")
  public Map<String, Object> studentRegister(@RequestBody StudentRegisterReq req) {
    if (studentRepo.existsByEmail(req.email())) {
      throw new IllegalArgumentException("Email already exists");
    }
    Student s = new Student();
    s.setName(req.name());
    s.setEmail(req.email().toLowerCase().trim());
    s.setPassword(encoder.encode(req.password()));
    s.setGuardianName(req.guardianName().trim());
    s.setSchool(req.school().trim());
    s.setGrade(req.grade().trim());
    s.setClassName(req.className().trim());

    LocalDate today = LocalDate.now(zoneId);
    s.setTierExpDate(today.plusDays(7));
    studentRepo.save(s);

    return Map.of("message", "Registered successfully");
  }

  public record EmailPasswordReq(@Email @NotBlank String email, @NotBlank String password) {}

  @PostMapping("/student/login")
  public Map<String, Object> studentLogin(@RequestBody EmailPasswordReq req) {
    Student s = studentRepo.findByEmail(req.email().toLowerCase().trim())
        .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

    if (!encoder.matches(req.password(), s.getPassword())) {
      throw new IllegalArgumentException("Invalid credentials");
    }

    checkStudentTrial(s);

    String access = jwtService.createAccessToken(s.getStudentId(), UserRole.STUDENT, s.getEmail());
    var rt = refreshTokenService.create(UserType.STUDENT, s.getStudentId());
    return Map.of("accessToken", access, "refreshToken", rt.getToken(), "role", "STUDENT");
  }

  // =========================
  // PARENT LOGIN
  // =========================
  public record ParentLoginReq(@NotBlank String guardianName, @Email @NotBlank String studentEmail, @NotBlank String studentPassword) {}

  @PostMapping("/parent/login")
  public Map<String, Object> parentLogin(@RequestBody ParentLoginReq req) {
    Student s = studentRepo.findByEmail(req.studentEmail().toLowerCase().trim())
        .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

    if (!encoder.matches(req.studentPassword(), s.getPassword())) {
      throw new IllegalArgumentException("Invalid credentials");
    }

    if (!s.getGuardianName().trim().equalsIgnoreCase(req.guardianName().trim())) {
      throw new IllegalArgumentException("Invalid credentials");
    }

    checkStudentTrial(s);

    String access = jwtService.createAccessToken(s.getStudentId(), UserRole.PARENT, s.getEmail());
    var rt = refreshTokenService.create(UserType.PARENT, s.getStudentId());
    return Map.of("accessToken", access, "refreshToken", rt.getToken(), "role", "PARENT", "studentId", s.getStudentId());
  }

  // =========================
  // TEACHER OTP LOGIN + PASSWORD LOGIN
  // =========================
  public record TeacherOtpLoginReq(@Email @NotBlank String email, @Pattern(regexp = "\\d{6}") String otp) {}

  @PostMapping("/teacher/login-otp")
  public Map<String, Object> teacherLoginOtp(@RequestBody TeacherOtpLoginReq req) {
    Teacher t = teacherRepo.findByEmail(req.email().toLowerCase().trim())
        .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

    checkTeacherTrial(t);

    if (t.getOtp() == null || !t.getOtp().equals(req.otp())) {
      throw new IllegalArgumentException("Invalid credentials");
    }

    // allow OTP login anytime, but if admin regenerated OTP they set passwordSet=false, UI should force password set again
    String access = jwtService.createAccessToken(t.getTeacherId(), UserRole.TEACHER, t.getEmail());
    var rt = refreshTokenService.create(UserType.TEACHER, t.getTeacherId());
    return Map.of(
        "accessToken", access,
        "refreshToken", rt.getToken(),
        "role", "TEACHER",
        "passwordSet", t.isPasswordSet()
    );
  }

  @PostMapping("/teacher/login")
  public Map<String, Object> teacherLoginPassword(@RequestBody EmailPasswordReq req) {
    Teacher t = teacherRepo.findByEmail(req.email().toLowerCase().trim())
        .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

    checkTeacherTrial(t);

    if (t.getPassword() == null || !encoder.matches(req.password(), t.getPassword())) {
      throw new IllegalArgumentException("Invalid credentials");
    }

    String access = jwtService.createAccessToken(t.getTeacherId(), UserRole.TEACHER, t.getEmail());
    var rt = refreshTokenService.create(UserType.TEACHER, t.getTeacherId());
    return Map.of(
        "accessToken", access,
        "refreshToken", rt.getToken(),
        "role", "TEACHER",
        "passwordSet", t.isPasswordSet()
    );
  }

  public record TeacherSetPasswordReq(@NotBlank @Size(min = 6) String newPassword) {}

  @PostMapping("/teacher/set-password")
  public Map<String, Object> teacherSetPassword(@RequestHeader("Authorization") String auth,
                                                @RequestBody TeacherSetPasswordReq req) {
    String token = auth.replace("Bearer", "").trim();
    var u = jwtService.toAuthUser(token);
    if (u.role() != UserRole.TEACHER) throw new SecurityException("Forbidden");

    Teacher t = teacherRepo.findById(u.userId()).orElseThrow();
    checkTeacherTrial(t);

    t.setPassword(encoder.encode(req.newPassword()));
    t.setPasswordSet(true);
    teacherRepo.save(t);

    return Map.of("message", "Password updated");
  }

  // =========================
  // ADMIN LOGIN
  // =========================

  @PostMapping("/admin/login")
  public Map<String, Object> adminLogin(@RequestBody EmailPasswordReq req) {
    AdminUser a = adminRepo.findByEmail(req.email().toLowerCase().trim())
        .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

    if (!encoder.matches(req.password(), a.getPassword())) {
      throw new IllegalArgumentException("Invalid credentials");
    }

    String access = jwtService.createAccessToken(a.getAdminId(), UserRole.ADMIN, a.getEmail());
    var rt = refreshTokenService.create(UserType.ADMIN, a.getAdminId());
    return Map.of("accessToken", access, "refreshToken", rt.getToken(), "role", "ADMIN");
  }

  // =========================
  // REFRESH + LOGOUT
  // =========================

  public record RefreshReq(@NotBlank String refreshToken) {}

  @PostMapping("/refresh")
  public Map<String, Object> refresh(@RequestBody RefreshReq req) {
    var rt = refreshTokenService.validateAndGet(req.refreshToken());

    UserRole role = switch (rt.getUserType()) {
      case STUDENT -> UserRole.STUDENT;
      case TEACHER -> UserRole.TEACHER;
      case PARENT -> UserRole.PARENT;
      case ADMIN -> UserRole.ADMIN;
    };

    String email;
    if (rt.getUserType() == UserType.STUDENT || rt.getUserType() == UserType.PARENT) {
      Student s = studentRepo.findById(rt.getUserId()).orElseThrow();
      email = s.getEmail();
    } else if (rt.getUserType() == UserType.TEACHER) {
      Teacher t = teacherRepo.findById(rt.getUserId()).orElseThrow();
      email = t.getEmail();
    } else {
      AdminUser a = adminRepo.findById(rt.getUserId()).orElseThrow();
      email = a.getEmail();
    }

    String access = jwtService.createAccessToken(rt.getUserId(), role, email);
    return Map.of("accessToken", access);
  }

  public record LogoutReq(@NotBlank String refreshToken) {}

  @PostMapping("/logout")
  public Map<String, Object> logout(@RequestBody LogoutReq req) {
    refreshTokenService.revoke(req.refreshToken());
    return Map.of("message", "Logged out");
  }

  // =========================
  // Trial check helpers
  // =========================

  private void checkStudentTrial(Student s) {
    LocalDate today = LocalDate.now(zoneId);
    if (s.getTierExpDate() != null && s.getTierExpDate().isBefore(today)) {
      throw new TrialExpiredException("Your trial ended. Please upload a payment slip to continue.");
    }
  }

  private void checkTeacherTrial(Teacher t) {
    LocalDate today = LocalDate.now(zoneId);
    if (t.getTierExpDate() != null && t.getTierExpDate().isBefore(today)) {
      throw new TrialExpiredException("Your trial ended. Please upload a payment slip to continue.");
    }
  }
}