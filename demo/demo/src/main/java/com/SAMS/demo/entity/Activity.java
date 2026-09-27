package com.SAMS.demo.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "activity")
public class Activity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "activity_id")
  private Long activityId;

  @Column(name = "subject_name", nullable = false)
  private String subjectName;

  @Column(name = "start_date", nullable = false)
  private LocalDate startDate;

  @Column(name = "start_time", nullable = false)
  private LocalTime startTime;

  @Column(name = "end_time", nullable = false)
  private LocalTime endTime;

  @Column(name = "duration", nullable = false)
  private int durationMinutes;

  @Column(length = 2000)
  private String description;

  @Column(name = "t_rate")
  private Integer tRate;

  @Column(name = "t_comment", length = 2000)
  private String tComment;

  @Column(name = "p_rate")
  private Integer pRate;

  @Column(name = "p_comment", length = 2000)
  private String pComment;

  // ---- Live study-session timer fields ----
  // PLANNED -> IN_PROGRESS -> COMPLETED
  @Column(name = "status", length = 20)
  private String status = "PLANNED";

  @Column(name = "actual_start_at")
  private Instant actualStartAt;

  @Column(name = "actual_end_at")
  private Instant actualEndAt;

  @Column(name = "actual_duration_seconds")
  private Long actualDurationSeconds;

  // Student's own reflection typed after stopping the timer; visible to the teacher.
  @Column(name = "student_feedback", length = 2000)
  private String studentFeedback;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "student_id", nullable = false)
  private Student student;

  public Long getActivityId() { return activityId; }
  public void setActivityId(Long activityId) { this.activityId = activityId; }
  public String getSubjectName() { return subjectName; }
  public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
  public LocalDate getStartDate() { return startDate; }
  public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
  public LocalTime getStartTime() { return startTime; }
  public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
  public LocalTime getEndTime() { return endTime; }
  public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
  public int getDurationMinutes() { return durationMinutes; }
  public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public Integer gettRate() { return tRate; }
  public void settRate(Integer tRate) { this.tRate = tRate; }
  public String gettComment() { return tComment; }
  public void settComment(String tComment) { this.tComment = tComment; }
  public Integer getpRate() { return pRate; }
  public void setpRate(Integer pRate) { this.pRate = pRate; }
  public String getpComment() { return pComment; }
  public void setpComment(String pComment) { this.pComment = pComment; }
  public Student getStudent() { return student; }
  public void setStudent(Student student) { this.student = student; }

  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public Instant getActualStartAt() { return actualStartAt; }
  public void setActualStartAt(Instant actualStartAt) { this.actualStartAt = actualStartAt; }
  public Instant getActualEndAt() { return actualEndAt; }
  public void setActualEndAt(Instant actualEndAt) { this.actualEndAt = actualEndAt; }
  public Long getActualDurationSeconds() { return actualDurationSeconds; }
  public void setActualDurationSeconds(Long actualDurationSeconds) { this.actualDurationSeconds = actualDurationSeconds; }
  public String getStudentFeedback() { return studentFeedback; }
  public void setStudentFeedback(String studentFeedback) { this.studentFeedback = studentFeedback; }
}