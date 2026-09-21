package com.SAMS.demo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import com.SAMS.demo.entity.Activity;
import com.SAMS.demo.entity.AdminUser;
import com.SAMS.demo.entity.Grade;
import com.SAMS.demo.entity.School;
import com.SAMS.demo.entity.SchoolClass;
import com.SAMS.demo.entity.Student;
import com.SAMS.demo.entity.Teacher;
import com.SAMS.demo.entity.TeacherStudent;
import com.SAMS.demo.repository.ActivityRepository;
import com.SAMS.demo.repository.AdminUserRepository;
import com.SAMS.demo.repository.GradeRepository;
import com.SAMS.demo.repository.SchoolClassRepository;
import com.SAMS.demo.repository.SchoolRepository;
import com.SAMS.demo.repository.StudentRepository;
import com.SAMS.demo.repository.TeacherRepository;
import com.SAMS.demo.repository.TeacherStudentRepository;

import jakarta.annotation.PostConstruct;
import java.time.*;
import java.util.List;

@Component
public class DataSeeder {

  private final AdminUserRepository adminRepo;
  private final TeacherRepository teacherRepo;
  private final StudentRepository studentRepo;
  private final ActivityRepository activityRepo;
  private final TeacherStudentRepository teacherStudentRepo;
  private final SchoolRepository schoolRepo;
  private final GradeRepository gradeRepo;
  private final SchoolClassRepository classRepo;
  private final BCryptPasswordEncoder encoder;
  private final ZoneId zoneId;

  public DataSeeder(AdminUserRepository adminRepo,
                    TeacherRepository teacherRepo,
                    StudentRepository studentRepo,
                    ActivityRepository activityRepo,
                    TeacherStudentRepository teacherStudentRepo,
                    SchoolRepository schoolRepo,
                    GradeRepository gradeRepo,
                    SchoolClassRepository classRepo,
                    BCryptPasswordEncoder encoder,
                    @Value("${app.timezone}") String timezone) {
    this.adminRepo = adminRepo;
    this.teacherRepo = teacherRepo;
    this.studentRepo = studentRepo;
    this.activityRepo = activityRepo;
    this.teacherStudentRepo = teacherStudentRepo;
    this.schoolRepo = schoolRepo;
    this.gradeRepo = gradeRepo;
    this.classRepo = classRepo;
    this.encoder = encoder;
    this.zoneId = ZoneId.of(timezone);
  }

  @PostConstruct
  public void seed() {
    if (adminRepo.count() > 0) return;

    LocalDate today = LocalDate.now(zoneId);

    // Admin
    AdminUser admin = new AdminUser();
    admin.setName("Admin");
    admin.setEmail("admin@timetable.lk");
    admin.setPassword(encoder.encode("admin123"));
    adminRepo.save(admin);

    // School structure
    School school = new School();
    school.setName("Demo School");
    schoolRepo.save(school);

    Grade grade = new Grade();
    grade.setName("Grade 6");
    grade.setSchool(school);
    gradeRepo.save(grade);

    // Teacher
    Teacher teacher = new Teacher();
    teacher.setName("Demo Teacher");
    teacher.setSchool("Demo School");
    teacher.setGrade("Grade 6");
    teacher.setClassName("A");
    teacher.setEmail("teacher@timetable.lk");
    teacher.setOtp("481902");
    teacher.setMappingCode("T357214");
    teacher.setTierExpDate(today.plusDays(21));
    teacher.setPassword(encoder.encode("teacher123"));
    teacher.setPasswordSet(true);
    teacherRepo.save(teacher);

    SchoolClass cls = new SchoolClass();
    cls.setName("A");
    cls.setGrade(grade);
    cls.setTeacher(teacher);
    classRepo.save(cls);

    // Student
    Student student = new Student();
    student.setName("Demo Student");
    student.setEmail("student@timetable.lk");
    student.setPassword(encoder.encode("student123"));
    student.setGuardianName("Mala Perera");
    student.setSchool("Demo School");
    student.setGrade("Grade 6");
    student.setClassName("A");
    student.setTierExpDate(today.plusDays(7));
    studentRepo.save(student);

    // Link teacher-student mapping
    TeacherStudent ts = new TeacherStudent();
    ts.setTeacher(teacher);
    ts.setStudent(student);
    ts.setLinkedAt(Instant.now());
    teacherStudentRepo.save(ts);

    // Two sample activities
    Activity a1 = new Activity();
    a1.setStudent(student);
    a1.setSubjectName("Mathematics");
    a1.setStartDate(today);
    a1.setStartTime(LocalTime.of(16, 0));
    a1.setEndTime(LocalTime.of(17, 0));
    a1.setDurationMinutes(60);
    a1.setDescription("Algebra practice");
    activityRepo.save(a1);

    Activity a2 = new Activity();
    a2.setStudent(student);
    a2.setSubjectName("Science");
    a2.setStartDate(today.minusDays(1));
    a2.setStartTime(LocalTime.of(18, 0));
    a2.setEndTime(LocalTime.of(18, 45));
    a2.setDurationMinutes(45);
    a2.setDescription("Reading chapter 2");
    activityRepo.save(a2);
  }
}