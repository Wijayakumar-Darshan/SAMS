package com.SAMS.demo.entity;

import java.time.LocalDate;

import jakarta.persistence.*;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;

@Entity
@Table(name = "teacher")
public class Teacher {
@Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "teacher_id")
  private Long teacherId;

  private String name;
  private String school;
  private String grade;

  @Column(name = "class")
  private String className;

  @Column(unique = true, nullable = false)
  private String email;

  private String password;

  @Column(name = "password_set", nullable = false)
  private boolean passwordSet = false;

  @Column(unique = true)
  private String otp; // 6 digits, unique

  @Column(name = "mapping_code", unique = true, nullable = false)
  private String mappingCode;

  @Column(name = "tier_exp_date")
  private LocalDate tierExpDate;

  public Long getTeacherId() { return teacherId; }
  public void setTeacherId(Long teacherId) { this.teacherId = teacherId; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getSchool() { return school; }
  public void setSchool(String school) { this.school = school; }
  public String getGrade() { return grade; }
  public void setGrade(String grade) { this.grade = grade; }
  public String getClassName() { return className; }
  public void setClassName(String className) { this.className = className; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getPassword() { return password; }
  public void setPassword(String password) { this.password = password; }
  public boolean isPasswordSet() { return passwordSet; }
  public void setPasswordSet(boolean passwordSet) { this.passwordSet = passwordSet; }
  public String getOtp() { return otp; }
  public void setOtp(String otp) { this.otp = otp; }
  public String getMappingCode() { return mappingCode; }
  public void setMappingCode(String mappingCode) { this.mappingCode = mappingCode; }
  public LocalDate getTierExpDate() { return tierExpDate; }
  public void setTierExpDate(LocalDate tierExpDate) { this.tierExpDate = tierExpDate; }
}
