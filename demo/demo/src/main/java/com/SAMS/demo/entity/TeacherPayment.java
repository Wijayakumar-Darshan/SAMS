package com.SAMS.demo.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "teacher_payment")
public class TeacherPayment {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "proof_path", nullable = false)
  private String proofPath;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PaymentStatus status = PaymentStatus.PENDING;

  @Column(name = "verified_by")
  private String verifiedBy;

  @Column(name = "verified_at")
  private Instant verifiedAt;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "teacher_id", nullable = false)
  private Teacher teacher;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getProofPath() { return proofPath; }
  public void setProofPath(String proofPath) { this.proofPath = proofPath; }
  public PaymentStatus getStatus() { return status; }
  public void setStatus(PaymentStatus status) { this.status = status; }
  public String getVerifiedBy() { return verifiedBy; }
  public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }
  public Instant getVerifiedAt() { return verifiedAt; }
  public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Teacher getTeacher() { return teacher; }
  public void setTeacher(Teacher teacher) { this.teacher = teacher; }
}
