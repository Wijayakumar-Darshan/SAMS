package com.SAMS.demo.controller;

import com.SAMS.demo.controller.RestExceptionHandler.TrialExpiredException;
import com.SAMS.demo.entity.*;
import com.SAMS.demo.repository.*;
import com.SAMS.demo.security.AuthUser;
import com.SAMS.demo.service.WeeklyLogService;
import java.util.LinkedHashMap;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parent")
public class ParentController {

  private final StudentRepository studentRepo;
  private final ActivityRepository activityRepo;
  private final WeeklyLogService weeklyLogService;
  private final ZoneId zoneId;

  public ParentController(StudentRepository studentRepo,
                          ActivityRepository activityRepo,
                          WeeklyLogService weeklyLogService,
                          @Value("${app.timezone}") String timezone) {
    this.studentRepo = studentRepo;
    this.activityRepo = activityRepo;
    this.weeklyLogService = weeklyLogService;
    this.zoneId = ZoneId.of(timezone);
  }

  private Long childId(Authentication auth) {
    return ((AuthUser) auth.getPrincipal()).userId(); // parent token subject = studentId
  }

  private Student child(Authentication auth) {
    return studentRepo.findById(childId(auth)).orElseThrow();
  }

  private void requireActiveTrial(Student s) {
    LocalDate today = LocalDate.now(zoneId);
    if (s.getTierExpDate() != null && s.getTierExpDate().isBefore(today)) {
      throw new TrialExpiredException("Your child's trial ended. Please upload a payment slip to continue.");
    }
  }

  @GetMapping("/me/dashboard")
  public Map<String, Object> dashboard(Authentication auth) {
    Student s = child(auth);
    requireActiveTrial(s);

    return Map.of(
        "studentName", s.getName(),
        "school", s.getSchool(),
        "grade", s.getGrade(),
        "className", s.getClassName()
    );
  }

  @GetMapping("/me/activities")
public List<Map<String, Object>> activities(Authentication auth) {
  Student s = child(auth);
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
        return m;
      })
      .toList();
}

  public record ParentRateReq(@Min(1) @Max(5) Integer pRate, String pComment) {}

  @PutMapping("/me/activities/{activityId}/rate")
  public Map<String, Object> rate(Authentication auth, @PathVariable Long activityId, @RequestBody ParentRateReq req) {
    Student s = child(auth);
    requireActiveTrial(s);

    Activity a = activityRepo.findById(activityId).orElseThrow();
    if (!a.getStudent().getStudentId().equals(s.getStudentId())) throw new SecurityException("Forbidden");

    a.setpRate(req.pRate());
    a.setpComment(req.pComment());
    activityRepo.save(a);

    return Map.of("message", "Rated");
  }

  @GetMapping("/me/weekly-report")
  public WeeklyLogService.WeeklyReport weekly(Authentication auth,
                                              @RequestParam(required = false) String weekStart) {
    Student s = child(auth);
    requireActiveTrial(s);

    LocalDate ws = (weekStart == null || weekStart.isBlank())
        ? weeklyLogService.currentWeekStart()
        : LocalDate.parse(weekStart);

    return weeklyLogService.computeAndStoreWeeklyLog(s.getStudentId(), ws);
  }
}
