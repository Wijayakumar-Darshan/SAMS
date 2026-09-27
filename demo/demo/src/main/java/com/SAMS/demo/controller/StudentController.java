package com.SAMS.demo.controller;

import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.LinkedHashMap;
import com.SAMS.demo.controller.RestExceptionHandler.TrialExpiredException;
import com.SAMS.demo.entity.Activity;
import com.SAMS.demo.entity.Student;
import com.SAMS.demo.entity.Teacher;
import com.SAMS.demo.repository.*;
import com.SAMS.demo.security.AuthUser;
import com.SAMS.demo.service.WeeklyLogService;

import java.time.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/student")
public class StudentController {

  private final StudentRepository studentRepo;
  private final TeacherRepository teacherRepo;
  private final ActivityRepository activityRepo;
  private final TeacherStudentRepository teacherStudentRepo;
  private final WeeklyLogService weeklyLogService;
  private final StudentNotificationRepository studentNotifRepo;
  private final ZoneId zoneId;

  public StudentController(StudentRepository studentRepo,
                           TeacherRepository teacherRepo,
                           ActivityRepository activityRepo,
                           TeacherStudentRepository teacherStudentRepo,
                           WeeklyLogService weeklyLogService,
                           StudentNotificationRepository studentNotifRepo,
                           @Value("${app.timezone}") String timezone) {
    this.studentRepo = studentRepo;
    this.teacherRepo = teacherRepo;
    this.activityRepo = activityRepo;
    this.teacherStudentRepo = teacherStudentRepo;
    this.weeklyLogService = weeklyLogService;
    this.studentNotifRepo = studentNotifRepo;
    this.zoneId = ZoneId.of(timezone);
  }

  private Long me(Authentication auth) {
    return ((AuthUser) auth.getPrincipal()).userId();
  }

  private Student requireMeStudent(Authentication auth) {
    return studentRepo.findById(me(auth)).orElseThrow();
  }

  private void requireActiveTrial(Student s) {
    LocalDate today = LocalDate.now(zoneId);
    if (s.getTierExpDate() != null && s.getTierExpDate().isBefore(today)) {
      throw new TrialExpiredException("Your trial ended. Please upload a payment slip to continue.");
    }
  }

  /**
   * Student dashboard summary.
   * Blocked when trial expired.
   */
 @GetMapping("/me/dashboard")
public Map<String, Object> dashboard(Authentication auth) {
  Student s = requireMeStudent(auth);
  requireActiveTrial(s);

  LocalDate today = LocalDate.now(zoneId);
  long daysLeft = s.getTierExpDate() == null ? 0
      : Duration.between(today.atStartOfDay(zoneId), s.getTierExpDate().plusDays(1).atStartOfDay(zoneId)).toDays();
  if (daysLeft < 0) daysLeft = 0;

  var weekStart = weeklyLogService.currentWeekStart();
  var rep = weeklyLogService.computeAndStoreWeeklyLog(s.getStudentId(), weekStart);

  Map<String, Object> m = new LinkedHashMap<>();
  m.put("studentName", s.getName());
  m.put("trialExpDate", String.valueOf(s.getTierExpDate()));
  m.put("daysLeft", daysLeft);
  m.put("avgHoursPerDay", rep.avgHoursPerDay());
  m.put("mostSpentSubject", rep.mostSpentSubject()); // can be null -> OK now
  m.put("changePercentVsLastWeek", rep.changePercentVsLastWeek());
  return m;
}

  public record ActivityReq(
      @NotBlank String subjectName,
      @NotBlank String startDate,
      @NotBlank String startTime,
      @NotBlank String endTime,
      String description
  ) {}

 @GetMapping("/me/activities")
public List<Map<String, Object>> myActivities(Authentication auth) {
  Student s = requireMeStudent(auth);
  requireActiveTrial(s);

  return activityRepo.findByStudent_StudentIdOrderByStartDateDescStartTimeDesc(s.getStudentId())
      .stream()
      .map(a -> {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("activityId", a.getActivityId());
        m.put("subjectName", a.getSubjectName());
        m.put("startDate", String.valueOf(a.getStartDate()));
        m.put("startTime", String.valueOf(a.getStartTime()));
        m.put("endTime", String.valueOf(a.getEndTime()));
        m.put("durationMinutes", a.getDurationMinutes());
        m.put("description", a.getDescription()); // can be null
        m.put("tRate", a.gettRate());             // can be null
        m.put("tComment", a.gettComment());       // can be null
        m.put("pRate", a.getpRate());             // can be null
        m.put("pComment", a.getpComment());       // can be null
        m.put("status", a.getStatus() == null ? "PLANNED" : a.getStatus());
        m.put("actualStartAt", a.getActualStartAt() == null ? null : a.getActualStartAt().toString());
        m.put("actualEndAt", a.getActualEndAt() == null ? null : a.getActualEndAt().toString());
        m.put("actualDurationSeconds", a.getActualDurationSeconds());
        m.put("studentFeedback", a.getStudentFeedback());
        return m;
      })
      .toList();
}
  @PostMapping("/me/activities")
  public Map<String, Object> create(Authentication auth, @RequestBody ActivityReq req) {
    Student s = requireMeStudent(auth);
    requireActiveTrial(s);

    Activity a = new Activity();
    a.setStudent(s);
    a.setSubjectName(req.subjectName().trim());
    a.setStartDate(LocalDate.parse(req.startDate()));
    a.setStartTime(LocalTime.parse(req.startTime()));
    a.setEndTime(LocalTime.parse(req.endTime()));
    a.setDescription(req.description());
    a.setStatus("PLANNED");

    int dur = calcDuration(a.getStartTime(), a.getEndTime());
    a.setDurationMinutes(dur);

    activityRepo.save(a);
    return Map.of("message", "Activity created");
  }

  @PutMapping("/me/activities/{activityId}")
  public Map<String, Object> update(Authentication auth, @PathVariable Long activityId, @RequestBody ActivityReq req) {
    Student s = requireMeStudent(auth);
    requireActiveTrial(s);

    Activity a = activityRepo.findById(activityId).orElseThrow();
    if (!a.getStudent().getStudentId().equals(s.getStudentId())) throw new SecurityException("Forbidden");

    a.setSubjectName(req.subjectName().trim());
    a.setStartDate(LocalDate.parse(req.startDate()));
    a.setStartTime(LocalTime.parse(req.startTime()));
    a.setEndTime(LocalTime.parse(req.endTime()));
    a.setDescription(req.description());
    a.setDurationMinutes(calcDuration(a.getStartTime(), a.getEndTime()));

    activityRepo.save(a);
    return Map.of("message", "Activity updated");
  }

  /**
   * Starts the real-time study timer for a planned activity.
   * The student presses "Start" right before they begin studying;
   * the elapsed wall-clock time is measured from this instant.
   */
  @PostMapping("/me/activities/{activityId}/start")
  public Map<String, Object> startActivity(Authentication auth, @PathVariable Long activityId) {
    Student s = requireMeStudent(auth);
    requireActiveTrial(s);

    Activity a = activityRepo.findById(activityId).orElseThrow();
    if (!a.getStudent().getStudentId().equals(s.getStudentId())) throw new SecurityException("Forbidden");
    if ("COMPLETED".equals(a.getStatus())) {
      throw new IllegalArgumentException("This activity is already completed.");
    }

    a.setStatus("IN_PROGRESS");
    a.setActualStartAt(Instant.now());
    a.setActualEndAt(null);
    a.setActualDurationSeconds(null);
    activityRepo.save(a);

    Map<String, Object> m = new LinkedHashMap<>();
    m.put("message", "Timer started");
    m.put("status", a.getStatus());
    m.put("actualStartAt", a.getActualStartAt().toString());
    return m;
  }

  public record StopActivityReq(String feedback) {}

  /**
   * Stops the timer, records the real (actual) time spent, and stores the
   * student's own feedback/reflection about the session. This feedback is
   * readable by the teacher on the teacher's student-activity view.
   */
  @PostMapping("/me/activities/{activityId}/stop")
  public Map<String, Object> stopActivity(Authentication auth, @PathVariable Long activityId,
                                           @RequestBody(required = false) StopActivityReq req) {
    Student s = requireMeStudent(auth);
    requireActiveTrial(s);

    Activity a = activityRepo.findById(activityId).orElseThrow();
    if (!a.getStudent().getStudentId().equals(s.getStudentId())) throw new SecurityException("Forbidden");
    if (a.getActualStartAt() == null) {
      throw new IllegalArgumentException("This activity's timer was not started.");
    }

    Instant end = Instant.now();
    long seconds = Duration.between(a.getActualStartAt(), end).getSeconds();
    if (seconds < 0) seconds = 0;

    a.setActualEndAt(end);
    a.setActualDurationSeconds(seconds);
    a.setStatus("COMPLETED");
    if (req != null && req.feedback() != null && !req.feedback().isBlank()) {
      a.setStudentFeedback(req.feedback().trim());
    }
    activityRepo.save(a);

    Map<String, Object> m = new LinkedHashMap<>();
    m.put("message", "Timer stopped");
    m.put("status", a.getStatus());
    m.put("actualDurationSeconds", seconds);
    return m;
  }

  /**
   * Student leaderboard table only (no emails).
   * Blocked when trial expired.
   */
  // @GetMapping("/me/leaderboard")
  // public Map<String, Object> leaderboard(Authentication auth) {
  //   Student s = requireMeStudent(auth);
  //   requireActiveTrial(s);

  //   var weekStart = weeklyLogService.currentWeekStart();
  //   var rows = weeklyLogService.leaderboardForAllStudents(weekStart);

  //   // Students should not see other student details; name + avg only.
  //   List<Map<String, Object>> table = rows.stream().map(r -> Map.<String, Object>of(
  //       "rank", 0, // frontend can compute rank after sorting; kept for compatibility
  //       "studentName", r.studentName(),
  //       "avgHoursPerDay", r.avgHoursPerDay(),
  //       "changePercent", r.changePercent()
  //   )).toList();

  //   return Map.of("weekStart", String.valueOf(weekStart), "rows", table);
  // }

  @GetMapping("/me/leaderboard")
public Map<String, Object> leaderboard(Authentication auth) {
  Student me = requireMeStudent(auth);
  requireActiveTrial(me);

  LocalDate weekStart = weeklyLogService.currentWeekStart();

  // 1) Decide which teacher group to use
  Long teacherId = null;

  // Prefer class teacher (student.teacher_id) if set
  if (me.getTeacher() != null && me.getTeacher().getTeacherId() != null) {
    teacherId = me.getTeacher().getTeacherId();
  } else {
    // Otherwise: latest linked teacher from teacher_student
    var latestLink = teacherStudentRepo.findFirstByStudent_StudentIdOrderByLinkedAtDesc(me.getStudentId());
    if (latestLink.isPresent()) {
      teacherId = latestLink.get().getTeacher().getTeacherId();
    }
  }

  // If no teacher linked, return empty leaderboard
  if (teacherId == null) {
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("weekStart", String.valueOf(weekStart));
    out.put("rows", List.of());
    return out;
  }

  // 2) Load only students linked to that teacher (IDs only -> avoids lazy loading errors)
  List<Long> studentIds = teacherStudentRepo.findStudentIdsByTeacherId(teacherId);
  List<Student> groupStudents = studentIds.isEmpty() ? List.of() : studentRepo.findAllById(studentIds);

  // 3) Compute leaderboard for that subset
  var rows = weeklyLogService.leaderboardForStudents(groupStudents, weekStart);

  // 4) Students see table only (no studentId)
  List<Map<String, Object>> table = rows.stream().map(r -> {
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("studentName", r.studentName() == null ? "" : r.studentName());
    m.put("avgHoursPerDay", r.avgHoursPerDay());
    m.put("changePercent", r.changePercent());
    return m;
  }).toList();

  Map<String, Object> out = new LinkedHashMap<>();
  out.put("weekStart", String.valueOf(weekStart));
  out.put("rows", table);
  return out;
}

  /**
   * Weekly report data (chart source).
   * Blocked when trial expired.
   */
  @GetMapping("/me/weekly-report")
  public WeeklyLogService.WeeklyReport weeklyReport(Authentication auth,
                                                    @RequestParam(required = false) String weekStart) {
    Student s = requireMeStudent(auth);
    requireActiveTrial(s);

    LocalDate ws = (weekStart == null || weekStart.isBlank())
        ? weeklyLogService.currentWeekStart()
        : LocalDate.parse(weekStart);
    return weeklyLogService.computeAndStoreWeeklyLog(s.getStudentId(), ws);
  }

  // WhatsApp update: teacher mapping must be within the same school.
  public record MapTeacherReq(@NotBlank String mappingCode) {}

  @PostMapping("/me/map-teacher")
  public Map<String, Object> mapTeacher(Authentication auth, @RequestBody MapTeacherReq req) {
    Student s = requireMeStudent(auth);
    requireActiveTrial(s);

    Teacher t = teacherRepo.findByMappingCode(req.mappingCode().trim())
        .orElseThrow(() -> new IllegalArgumentException("Invalid mapping code"));

    if (s.getSchool() == null || t.getSchool() == null || !s.getSchool().trim().equalsIgnoreCase(t.getSchool().trim())) {
      throw new IllegalArgumentException("This teacher mapping code is only valid for the same school.");
    }

    if (!teacherStudentRepo.existsByTeacher_TeacherIdAndStudent_StudentId(t.getTeacherId(), s.getStudentId())) {
      var link = new com.SAMS.demo.entity.TeacherStudent();
      link.setTeacher(t);
      link.setStudent(s);
      link.setLinkedAt(Instant.now());
      teacherStudentRepo.save(link);
    }

    return Map.of("message", "Teacher linked");
  }

  // Added so the UI can show an already-connected state instead of always showing the link form.
  @GetMapping("/me/teachers")
  @Transactional(readOnly = true) // keeps the Hibernate session open so link.getTeacher() (LAZY) can be read safely
  public List<Map<String, Object>> myTeachers(Authentication auth) {
    Student s = requireMeStudent(auth);
    return teacherStudentRepo.findByStudent_StudentId(s.getStudentId()).stream()
        .map(link -> {
          Teacher t = link.getTeacher();
          Map<String, Object> m = new LinkedHashMap<>();
          m.put("teacherId", t.getTeacherId());
          m.put("name", t.getName());
          m.put("school", t.getSchool());
          m.put("grade", t.getGrade());
          m.put("className", t.getClassName());
          m.put("linkedAt", link.getLinkedAt() == null ? null : link.getLinkedAt().toString());
          return m;
        })
        .toList();
  }

  @GetMapping("/me/notifications")
  public List<Map<String, Object>> notifications(Authentication auth) {
    Student s = requireMeStudent(auth);
    // allow even if expired (so they can see payment notifications)
    return studentNotifRepo.findByStudent_StudentIdOrderByCreatedAtDesc(s.getStudentId())
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
    Student s = requireMeStudent(auth);
    var n = studentNotifRepo.findById(id).orElseThrow();
    if (!n.getStudent().getStudentId().equals(s.getStudentId())) throw new SecurityException("Forbidden");
    n.setRead(true);
    studentNotifRepo.save(n);
    return Map.of("message", "Marked as read");
  }

  private int calcDuration(LocalTime start, LocalTime end) {
    int minutes = (int) Duration.between(start, end).toMinutes();
    if (minutes <= 0) throw new IllegalArgumentException("End time must be after start time");
    return minutes;
  }
}
