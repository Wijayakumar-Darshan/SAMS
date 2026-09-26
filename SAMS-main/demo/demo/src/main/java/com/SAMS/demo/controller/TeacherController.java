package com.SAMS.demo.controller;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.LinkedHashMap;

import com.SAMS.demo.controller.RestExceptionHandler.TrialExpiredException;
import com.SAMS.demo.entity.*;
import com.SAMS.demo.repository.*;
import com.SAMS.demo.security.AuthUser;
import com.SAMS.demo.service.WeeklyLogService;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teacher")
public class TeacherController {

  private final TeacherRepository teacherRepo;
  private final TeacherStudentRepository teacherStudentRepo;
  private final ActivityRepository activityRepo;
  private final WeeklyLogService weeklyLogService;
  private final TeacherNotificationRepository teacherNotifRepo;
  private final ZoneId zoneId;
 private final StudentRepository studentRepo;

public TeacherController(TeacherRepository teacherRepo,
                         TeacherStudentRepository teacherStudentRepo,
                         ActivityRepository activityRepo,
                         WeeklyLogService weeklyLogService,
                         TeacherNotificationRepository teacherNotifRepo,
                         StudentRepository studentRepo,
                         @Value("${app.timezone}") String timezone) {
  this.teacherRepo = teacherRepo;
  this.teacherStudentRepo = teacherStudentRepo;
  this.activityRepo = activityRepo;
  this.weeklyLogService = weeklyLogService;
  this.teacherNotifRepo = teacherNotifRepo;
  this.studentRepo = studentRepo;
  this.zoneId = ZoneId.of(timezone);
}

  private Long me(Authentication auth) {
    return ((AuthUser) auth.getPrincipal()).userId();
  }

  private Teacher requireMeTeacher(Authentication auth) {
    return teacherRepo.findById(me(auth)).orElseThrow();
  }

  private void requireActiveTrial(Teacher t) {
    LocalDate today = LocalDate.now(zoneId);
    if (t.getTierExpDate() != null && t.getTierExpDate().isBefore(today)) {
      throw new TrialExpiredException("Your trial ended. Please upload a payment slip to continue.");
    }
  }

  // @GetMapping("/me/dashboard")
  // public Map<String, Object> dashboard(Authentication auth) {
  //   Teacher t = requireMeTeacher(auth);
  //   requireActiveTrial(t);

  //   LocalDate today = LocalDate.now(zoneId);
  //   long daysLeft = t.getTierExpDate() == null ? 0 : today.until(t.getTierExpDate()).getDays();
  //   if (daysLeft < 0) daysLeft = 0;

  //   // Bug fix: "school" was missing here, which made the teacher's QR code
  //   // (SAMS|<school>|<mappingCode>) always encode an empty school segment.
  //   return Map.of(
  //       "teacherName", t.getName(),
  //       "email", t.getEmail(),
  //       "mappingCode", t.getMappingCode(),
  //       "school", t.getSchool() == null ? "" : t.getSchool(),
  //       "trialExpDate", String.valueOf(t.getTierExpDate()),
  //       "daysLeft", daysLeft,
  //       "passwordSet", t.isPasswordSet()
  //   );
  // }
@GetMapping("/me/dashboard")
public Map<String, Object> dashboard(Authentication auth) {
  Teacher t = requireMeTeacher(auth);
  requireActiveTrial(t);

  LocalDate today = LocalDate.now(zoneId);
  long daysLeft = t.getTierExpDate() == null ? 0 : java.time.temporal.ChronoUnit.DAYS.between(today, t.getTierExpDate());
  if (daysLeft < 0) daysLeft = 0;

  Map<String, Object> m = new LinkedHashMap<>();
  m.put("teacherName", t.getName());
  m.put("email", t.getEmail());
  m.put("mappingCode", t.getMappingCode());
  m.put("school", t.getSchool() == null ? "" : t.getSchool());
  m.put("trialExpDate", String.valueOf(t.getTierExpDate()));
  m.put("daysLeft", daysLeft);
  m.put("passwordSet", t.isPasswordSet());

  // show OTP only until password is set
  m.put("otp", t.isPasswordSet() ? "" : (t.getOtp() == null ? "" : t.getOtp()));

  return m;
}
@GetMapping("/me/students")
public List<Map<String, Object>> students(Authentication auth) {
  Teacher t = requireMeTeacher(auth);
  requireActiveTrial(t);

  List<Long> ids = teacherStudentRepo.findStudentIdsByTeacherId(t.getTeacherId());
  List<Student> studs = ids.isEmpty() ? List.of() : studentRepo.findAllById(ids);

  return studs.stream().map(s -> {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("studentId", s.getStudentId());
    m.put("name", s.getName() == null ? "" : s.getName());
    m.put("school", s.getSchool() == null ? "" : s.getSchool());
    m.put("grade", s.getGrade() == null ? "" : s.getGrade());
    m.put("className", s.getClassName() == null ? "" : s.getClassName());
    return m;
  }).toList();
}

  // @GetMapping("/me/students/{studentId}/activities")
  // public List<Map<String, Object>> studentActivities(Authentication auth, @PathVariable Long studentId) {
  //   Teacher t = requireMeTeacher(auth);
  //   requireActiveTrial(t);

  //   if (!teacherStudentRepo.existsByTeacher_TeacherIdAndStudent_StudentId(t.getTeacherId(), studentId)) {
  //     throw new SecurityException("Forbidden");
  //   }

  //   return activityRepo.findByStudent_StudentIdOrderByStartDateDescStartTimeDesc(studentId)
  //       .stream()
  //       .map(a -> {
  //         Map<String, Object> m = new LinkedHashMap<>();
  //         m.put("activityId", a.getActivityId());
  //         m.put("subjectName", a.getSubjectName());
  //         m.put("startDate", String.valueOf(a.getStartDate()));
  //         m.put("startTime", String.valueOf(a.getStartTime()));
  //         m.put("endTime", String.valueOf(a.getEndTime()));
  //         m.put("durationMinutes", a.getDurationMinutes());
  //         m.put("description", a.getDescription());
  //         m.put("tRate", a.gettRate());
  //         m.put("tComment", a.gettComment());
  //         m.put("pRate", a.getpRate());
  //         m.put("pComment", a.getpComment());
  //         return m;
  //       }).toList();
  // }
@GetMapping("/students/{studentId}/activities")
public List<Map<String, Object>> anyStudentActivities(Authentication auth, @PathVariable Long studentId) {
  Teacher t = requireMeTeacher(auth);
  requireActiveTrial(t);

  // Optional: validate student exists (otherwise you can just return empty list)
  // studentRepo.findById(studentId).orElseThrow(() -> new IllegalArgumentException("Student not found"));

  return activityRepo.findByStudent_StudentIdOrderByStartDateDescStartTimeDesc(studentId)
      .stream()
      .map(a -> {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("activityId", a.getActivityId());
        m.put("subjectName", a.getSubjectName());
        m.put("startDate", String.valueOf(a.getStartDate()));
        m.put("startTime", String.valueOf(a.getStartTime()));
        m.put("endTime", String.valueOf(a.getEndTime()));
        m.put("durationMinutes", a.getDurationMinutes());

        // NULL-SAFE fields
        m.put("description", a.getDescription() == null ? "" : a.getDescription());
        m.put("tRate", a.gettRate());                 // can be null -> ok
        m.put("tComment", a.gettComment() == null ? "" : a.gettComment());
        m.put("pRate", a.getpRate());                 // can be null -> ok
        m.put("pComment", a.getpComment() == null ? "" : a.getpComment());
        return m;
      })
      .toList();
}
  public record TeacherRateReq(@Min(1) @Max(5) Integer tRate, String tComment) {}

  @PutMapping("/me/activities/{activityId}/rate")
  public Map<String, Object> rate(Authentication auth, @PathVariable Long activityId, @RequestBody TeacherRateReq req) {
    Teacher t = requireMeTeacher(auth);
    requireActiveTrial(t);

    Activity a = activityRepo.findById(activityId).orElseThrow();
    Long studentId = a.getStudent().getStudentId();

    if (!teacherStudentRepo.existsByTeacher_TeacherIdAndStudent_StudentId(t.getTeacherId(), studentId)) {
      throw new SecurityException("Forbidden");
    }

    a.settRate(req.tRate());
    a.settComment(req.tComment());
    activityRepo.save(a);

    return Map.of("message", "Rated");
  }

  /**
   * Teacher leaderboard: can see studentId to open details.
   */
  // @GetMapping("/leaderboard")
  // public Map<String, Object> leaderboard(Authentication auth) {
  //   Teacher t = requireMeTeacher(auth);
  //   requireActiveTrial(t);

  //   var ws = weeklyLogService.currentWeekStart();
  //   var rows = weeklyLogService.leaderboardForAllStudents(ws);

  //   List<Map<String, Object>> table = rows.stream().map(r -> Map.<String, Object>of(
  //       "studentId", r.studentId(),
  //       "studentName", r.studentName(),
  //       "avgHoursPerDay", r.avgHoursPerDay(),
  //       "changePercent", r.changePercent()
  //   )).toList();

  //   return Map.of("weekStart", String.valueOf(ws), "rows", table);
  // }

  @GetMapping("/leaderboard")
public Map<String, Object> leaderboard(Authentication auth) {
  Teacher t = requireMeTeacher(auth);
  requireActiveTrial(t);

  LocalDate ws = weeklyLogService.currentWeekStart();

  List<Long> ids = teacherStudentRepo.findStudentIdsByTeacherId(t.getTeacherId());
  List<Student> studs = ids.isEmpty() ? List.of() : studentRepo.findAllById(ids);

  var rows = weeklyLogService.leaderboardForStudents(studs, ws);

  List<Map<String, Object>> table = rows.stream().map(r -> {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("studentId", r.studentId());
    m.put("studentName", r.studentName() == null ? "" : r.studentName());
    m.put("avgHoursPerDay", r.avgHoursPerDay());
    m.put("changePercent", r.changePercent());
    return m;
  }).toList();

  Map<String, Object> out = new LinkedHashMap<>();
  out.put("weekStart", String.valueOf(ws));
  out.put("rows", table);
  return out;
}

  @GetMapping("/me/notifications")
  public List<Map<String, Object>> notifications(Authentication auth) {
    Teacher t = requireMeTeacher(auth);
    return teacherNotifRepo.findByTeacher_TeacherIdOrderByCreatedAtDesc(t.getTeacherId())
        .stream()
        .map(n -> Map.<String, Object>of(
            "id", n.getId(),
            "message", n.getMessage(),
            "read", n.isRead(),
            "createdAt", n.getCreatedAt().toString()
        )).toList();
  }

  @PostMapping("/me/notifications/{id}/read")
  public Map<String, Object> markRead(Authentication auth, @PathVariable Long id) {
    Teacher t = requireMeTeacher(auth);
    var n = teacherNotifRepo.findById(id).orElseThrow();
    if (!n.getTeacher().getTeacherId().equals(t.getTeacherId())) throw new SecurityException("Forbidden");
    n.setRead(true);
    teacherNotifRepo.save(n);
    return Map.of("message", "Marked as read");
  }
}
