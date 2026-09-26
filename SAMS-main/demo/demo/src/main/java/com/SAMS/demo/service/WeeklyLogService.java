package com.SAMS.demo.service;

import com.SAMS.demo.entity.*;
import com.SAMS.demo.repository.ActivityLogRepository;
import com.SAMS.demo.repository.ActivityRepository;
import com.SAMS.demo.repository.StudentRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WeeklyLogService {

  private final ActivityRepository activityRepo;
  private final ActivityLogRepository logRepo;
  private final StudentRepository studentRepo;
  private final ZoneId zoneId;

  public WeeklyLogService(ActivityRepository activityRepo,
                          ActivityLogRepository logRepo,
                          StudentRepository studentRepo,
                          @Value("${app.timezone}") String timezone) {
    this.activityRepo = activityRepo;
    this.logRepo = logRepo;
    this.studentRepo = studentRepo;
    this.zoneId = ZoneId.of(timezone);
  }

 public LocalDate currentWeekStart() {
  LocalDate today = LocalDate.now(zoneId);
  return today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
}

  public WeeklyReport computeAndStoreWeeklyLog(Long studentId, LocalDate weekStart) {
    Student student = studentRepo.findById(studentId).orElseThrow();

    LocalDate from = weekStart;
    LocalDate to = weekStart.plusDays(6);

    List<Activity> weekActs = activityRepo.findByStudent_StudentIdAndStartDateBetween(studentId, from, to);

    Map<String, Integer> minutesBySubject = new HashMap<>();
    for (Activity a : weekActs) {
      minutesBySubject.merge(a.getSubjectName(), a.getDurationMinutes(), Integer::sum);
    }

    double totalHours = minutesBySubject.values().stream().mapToInt(i -> i).sum() / 60.0;
    double avgHoursPerDay = totalHours / 7.0;

    String mostSubject = null;
    double mostHours = 0;
    String leastSubject = null;
    double leastHours = 0;

    if (!minutesBySubject.isEmpty()) {
      var sorted = minutesBySubject.entrySet().stream()
          .sorted(Map.Entry.comparingByValue())
          .collect(Collectors.toList());

      leastSubject = sorted.getFirst().getKey();
      leastHours = sorted.getFirst().getValue() / 60.0;

      mostSubject = sorted.getLast().getKey();
      mostHours = sorted.getLast().getValue() / 60.0;
    }

    // last week change
    LocalDate lastWeek = weekStart.minusWeeks(1);
    double lastTotalHours = activityRepo
        .findByStudent_StudentIdAndStartDateBetween(studentId, lastWeek, lastWeek.plusDays(6))
        .stream().mapToInt(Activity::getDurationMinutes).sum() / 60.0;

    double changePercent;
    if (lastTotalHours <= 0.0001) {
      changePercent = totalHours > 0 ? 100.0 : 0.0;
    } else {
      changePercent = ((totalHours - lastTotalHours) / lastTotalHours) * 100.0;
    }

    ActivityLog log = logRepo.findByStudent_StudentIdAndWeekStart(studentId, weekStart)
        .orElseGet(ActivityLog::new);

    log.setStudent(student);
    log.setWeekStart(weekStart);
    log.setMostSpentSubject(mostSubject);
    log.setMostSpentHours(round2(mostHours));
    log.setLeastSpentSubject(leastSubject);
    log.setLeastSpentHours(round2(leastHours));
    log.setAvgHours(round2(avgHoursPerDay));
    log.setChangePercentVsLastWeek(round2(changePercent));

    // best avg so far
    List<ActivityLog> allLogs = logRepo.findByStudent_StudentIdOrderByWeekStartAsc(studentId);
    double prevBest = allLogs.stream().mapToDouble(ActivityLog::getAvgHours).max().orElse(0);
    double best = Math.max(prevBest, avgHoursPerDay);
    log.setBestAvg(round2(best));

    ActivityLog saved = logRepo.save(log);

    Map<String, Double> hoursBySubject = minutesBySubject.entrySet().stream()
        .collect(Collectors.toMap(Map.Entry::getKey, e -> round2(e.getValue() / 60.0)));

    return new WeeklyReport(
        saved.getWeekStart(),
        saved.getMostSpentSubject(),
        saved.getMostSpentHours(),
        saved.getLeastSpentSubject(),
        saved.getLeastSpentHours(),
        saved.getAvgHours(),
        saved.getBestAvg(),
        saved.getChangePercentVsLastWeek(),
        hoursBySubject
    );
  }

  public List<LeaderboardRow> leaderboardForAllStudents(LocalDate weekStart) {
    List<Student> students = studentRepo.findAll();

    List<LeaderboardRow> rows = new ArrayList<>();
    for (Student s : students) {
      WeeklyReport rep = computeAndStoreWeeklyLog(s.getStudentId(), weekStart);
      rows.add(new LeaderboardRow(
          s.getStudentId(),
          s.getName(),
          rep.avgHoursPerDay(),
          rep.changePercentVsLastWeek()
      ));
    }

    rows.sort(Comparator.comparingDouble(LeaderboardRow::avgHoursPerDay).reversed());
    return rows;
  }

  private double round2(double v) {
    return Math.round(v * 100.0) / 100.0;
  }

  public record WeeklyReport(
      LocalDate weekStart,
      String mostSpentSubject,
      double mostSpentHours,
      String leastSpentSubject,
      double leastSpentHours,
      double avgHoursPerDay,
      double bestAvg,
      double changePercentVsLastWeek,
      Map<String, Double> hoursBySubject
  ) { }

  public record LeaderboardRow(
      Long studentId,
      String studentName,
      double avgHoursPerDay,
      double changePercent
  ) { }

  public List<LeaderboardRow> leaderboardForStudents(List<Student> students, LocalDate weekStart) {
  List<LeaderboardRow> rows = new java.util.ArrayList<>();
  for (Student s : students) {
    WeeklyReport rep = computeAndStoreWeeklyLog(s.getStudentId(), weekStart);
    rows.add(new LeaderboardRow(
        s.getStudentId(),
        s.getName(),
        rep.avgHoursPerDay(),
        rep.changePercentVsLastWeek()
    ));
  }
  rows.sort(java.util.Comparator.comparingDouble(LeaderboardRow::avgHoursPerDay).reversed());
  return rows;
}
}