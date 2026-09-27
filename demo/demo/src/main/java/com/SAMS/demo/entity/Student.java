package com.SAMS.demo.entity;
import jakarta.persistence.*;
import java.time.LocalDate;


@Entity
@Table(name = "student")
public class Student {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "student_id")
  private Long studentId;

  private String name;

  @Column(unique = true, nullable = false)
  private String email;

  @Column(nullable = false)
  private String password;

  @Column(name = "guardian_name")
  private String guardianName;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "teacher_id")
  private Teacher teacher; // optional legacy class teacher link

  @Column(name = "tier_exp_date")
  private LocalDate tierExpDate;

  private String school;
  private String grade;

  @Column(name = "class")
  private String className;

  public Long getStudentId() { return studentId; }
  public void setStudentId(Long studentId) { this.studentId = studentId; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getPassword() { return password; }
  public void setPassword(String password) { this.password = password; }
  public String getGuardianName() { return guardianName; }
  public void setGuardianName(String guardianName) { this.guardianName = guardianName; }
  public Teacher getTeacher() { return teacher; }
  public void setTeacher(Teacher teacher) { this.teacher = teacher; }
  public LocalDate getTierExpDate() { return tierExpDate; }
  public void setTierExpDate(LocalDate tierExpDate) { this.tierExpDate = tierExpDate; }
  public String getSchool() { return school; }
  public void setSchool(String school) { this.school = school; }
  public String getGrade() { return grade; }
  public void setGrade(String grade) { this.grade = grade; }
  public String getClassName() { return className; }
  public void setClassName(String className) { this.className = className; }
}