package com.SAMS.demo.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "activity_log",
    uniqueConstraints = @UniqueConstraint(columnNames = {"week_start", "student_id"}))
public class ActivityLog {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "log_id")
  private Long logId;

  @Column(name = "week_start", nullable = false)
  private LocalDate weekStart;

  @Column(name = "most_spent_subject")
  private String mostSpentSubject;

  @Column(name = "most_spent_hours")
  private double mostSpentHours;

  @Column(name = "least_spent_subject")
  private String leastSpentSubject;

  @Column(name = "least_spent_hours")
  private double leastSpentHours;

  @Column(name = "avg_hours")
  private double avgHours;

  @Column(name = "best_avg")
  private double bestAvg;

  @Column(name = "change_percent_vs_last_week")
  private double changePercentVsLastWeek;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "student_id", nullable = false)
  private Student student;

  public Long getLogId() { return logId; }
  public void setLogId(Long logId) { this.logId = logId; }
  public LocalDate getWeekStart() { return weekStart; }
  public void setWeekStart(LocalDate weekStart) { this.weekStart = weekStart; }
  public String getMostSpentSubject() { return mostSpentSubject; }
  public void setMostSpentSubject(String mostSpentSubject) { this.mostSpentSubject = mostSpentSubject; }
  public double getMostSpentHours() { return mostSpentHours; }
  public void setMostSpentHours(double mostSpentHours) { this.mostSpentHours = mostSpentHours; }
  public String getLeastSpentSubject() { return leastSpentSubject; }
  public void setLeastSpentSubject(String leastSpentSubject) { this.leastSpentSubject = leastSpentSubject; }
  public double getLeastSpentHours() { return leastSpentHours; }
  public void setLeastSpentHours(double leastSpentHours) { this.leastSpentHours = leastSpentHours; }
  public double getAvgHours() { return avgHours; }
  public void setAvgHours(double avgHours) { this.avgHours = avgHours; }
  public double getBestAvg() { return bestAvg; }
  public void setBestAvg(double bestAvg) { this.bestAvg = bestAvg; }
  public double getChangePercentVsLastWeek() { return changePercentVsLastWeek; }
  public void setChangePercentVsLastWeek(double changePercentVsLastWeek) { this.changePercentVsLastWeek = changePercentVsLastWeek; }
  public Student getStudent() { return student; }
  public void setStudent(Student student) { this.student = student; }}