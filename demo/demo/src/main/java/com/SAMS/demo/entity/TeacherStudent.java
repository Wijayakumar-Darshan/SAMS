package com.SAMS.demo.entity;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "teacher_student",
    uniqueConstraints = @UniqueConstraint(columnNames = {"teacher_id", "student_id"}))
public class TeacherStudent {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "teacher_id", nullable = false)
  private Teacher teacher;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "student_id", nullable = false)
  private Student student;

  @Column(name = "linked_at", nullable = false)
  private Instant linkedAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Teacher getTeacher() { return teacher; }
  public void setTeacher(Teacher teacher) { this.teacher = teacher; }
  public Student getStudent() { return student; }
  public void setStudent(Student student) { this.student = student; }
  public Instant getLinkedAt() { return linkedAt; }
  public void setLinkedAt(Instant linkedAt) { this.linkedAt = linkedAt; }
}