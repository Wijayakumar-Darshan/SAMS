package com.SAMS.demo.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "teacher_notification")
public class TeacherNotification {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(length = 2000, nullable = false)
  private String message;

  @Column(name = "read", nullable = false)
  private boolean read = false;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "teacher_id", nullable = false)
  private Teacher teacher;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }
  public boolean isRead() { return read; }
  public void setRead(boolean read) { this.read = read; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Teacher getTeacher() { return teacher; }
  public void setTeacher(Teacher teacher) { this.teacher = teacher; }
}