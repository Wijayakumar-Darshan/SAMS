// package com.SAMS.demo.config;

// import com.SAMS.demo.entity.*;
// import com.SAMS.demo.repository.*;
// import jakarta.annotation.PostConstruct;
// import jakarta.persistence.EntityManager;
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
// import org.springframework.stereotype.Component;
// import org.springframework.transaction.annotation.Transactional;

// import java.time.*;
// import java.util.List;
// import java.util.Random;

// @Component
// public class DataSeeder {

//     private final AdminUserRepository adminRepo;
//     private final TeacherRepository teacherRepo;
//     private final StudentRepository studentRepo;
//     private final ActivityRepository activityRepo;
//     private final TeacherStudentRepository teacherStudentRepo;

//     private final SchoolRepository schoolRepo;
//     private final GradeRepository gradeRepo;
//     private final SchoolClassRepository classRepo;

//     private final StudentNotificationRepository studentNotifRepo;
//     private final TeacherNotificationRepository teacherNotifRepo;
//     private final StudentPaymentRepository studentPayRepo;
//     private final TeacherPaymentRepository teacherPayRepo;
//     private final RefreshTokenRepository refreshTokenRepo;

//     private final BCryptPasswordEncoder encoder;
//     private final EntityManager entityManager;

//     private final ZoneId zoneId;
//     private final boolean seedEnabled;
//     private final boolean seedForce;

//     public DataSeeder(
//             AdminUserRepository adminRepo,
//             TeacherRepository teacherRepo,
//             StudentRepository studentRepo,
//             ActivityRepository activityRepo,
//             TeacherStudentRepository teacherStudentRepo,

//             SchoolRepository schoolRepo,
//             GradeRepository gradeRepo,
//             SchoolClassRepository classRepo,

//             StudentNotificationRepository studentNotifRepo,
//             TeacherNotificationRepository teacherNotifRepo,
//             StudentPaymentRepository studentPayRepo,
//             TeacherPaymentRepository teacherPayRepo,
//             RefreshTokenRepository refreshTokenRepo,

//             BCryptPasswordEncoder encoder,
//             EntityManager entityManager,

//             @Value("${app.timezone}") String timezone,
//             @Value("${app.seed.enabled:true}") boolean seedEnabled,
//             @Value("${app.seed.force:false}") boolean seedForce
//     ) {
//         this.adminRepo = adminRepo;
//         this.teacherRepo = teacherRepo;
//         this.studentRepo = studentRepo;
//         this.activityRepo = activityRepo;
//         this.teacherStudentRepo = teacherStudentRepo;

//         this.schoolRepo = schoolRepo;
//         this.gradeRepo = gradeRepo;
//         this.classRepo = classRepo;

//         this.studentNotifRepo = studentNotifRepo;
//         this.teacherNotifRepo = teacherNotifRepo;
//         this.studentPayRepo = studentPayRepo;
//         this.teacherPayRepo = teacherPayRepo;
//         this.refreshTokenRepo = refreshTokenRepo;

//         this.encoder = encoder;
//         this.entityManager = entityManager;

//         this.zoneId = ZoneId.of(timezone);
//         this.seedEnabled = seedEnabled;
//         this.seedForce = seedForce;
//     }

//     @PostConstruct
//     @Transactional
//     public void seed() {

//         if (!seedEnabled) {
//             return;
//         }

//         if (!seedForce) {
//             boolean adminExists =
//                     adminRepo.existsByEmail("admin@timetable.lk");

//             long studentCount =
//                     studentRepo.count();

//             if (adminExists && studentCount >= 10) {
//                 return;
//             }
//         }

//         if (seedForce) {

//             /*
//              * DEV ONLY
//              *
//              * Temporarily disable MySQL foreign-key checks
//              * while clearing the demo database.
//              */
//             entityManager
//                     .createNativeQuery("SET FOREIGN_KEY_CHECKS = 0")
//                     .executeUpdate();

//             try {

//                 refreshTokenRepo.deleteAllInBatch();

//                 studentPayRepo.deleteAllInBatch();
//                 teacherPayRepo.deleteAllInBatch();

//                 studentNotifRepo.deleteAllInBatch();
//                 teacherNotifRepo.deleteAllInBatch();

//                 teacherStudentRepo.deleteAllInBatch();

//                 /*
//                  * Explicitly clear activity_log.
//                  *
//                  * This is the table shown in the MySQL error:
//                  *
//                  * activity_log.student_id
//                  *        ->
//                  * student.student_id
//                  */
//                 entityManager
//                         .createNativeQuery("DELETE FROM activity_log")
//                         .executeUpdate();

//                 studentRepo.deleteAllInBatch();

//                 classRepo.deleteAllInBatch();

//                 gradeRepo.deleteAllInBatch();

//                 schoolRepo.deleteAllInBatch();

//                 teacherRepo.deleteAllInBatch();

//                 adminRepo.deleteAllInBatch();

//                 entityManager.flush();

//             } finally {

//                 /*
//                  * Always restore foreign-key checking.
//                  */
//                 entityManager
//                         .createNativeQuery("SET FOREIGN_KEY_CHECKS = 1")
//                         .executeUpdate();
//             }
//         }

//         LocalDate today = LocalDate.now(zoneId);

//         // =========================
//         // Admin
//         // =========================

//         AdminUser admin = new AdminUser();

//         admin.setName("Admin");
//         admin.setEmail("admin@timetable.lk");
//         admin.setPassword(
//                 encoder.encode("admin123")
//         );

//         adminRepo.save(admin);

//         // =========================
//         // School
//         // =========================

//         School school = new School();

//         school.setName("Demo School");

//         schoolRepo.save(school);

//         // =========================
//         // Grade
//         // =========================

//         Grade grade = new Grade();

//         grade.setName("Grade 6");
//         grade.setSchool(school);

//         gradeRepo.save(grade);

//         // =========================
//         // Teacher
//         // =========================

//         Teacher teacher = new Teacher();

//         teacher.setName("Demo Teacher");
//         teacher.setSchool("Demo School");
//         teacher.setGrade("Grade 6");
//         teacher.setClassName("A");
//         teacher.setEmail("teacher@timetable.lk");

//         teacher.setOtp("481902");
//         teacher.setMappingCode("T357214");

//         teacher.setTierExpDate(
//                 today.plusDays(21)
//         );

//         teacher.setPassword(
//                 encoder.encode("teacher123")
//         );

//         teacher.setPasswordSet(true);

//         teacherRepo.save(teacher);

//         // =========================
//         // School Class
//         // =========================

//         SchoolClass cls = new SchoolClass();

//         cls.setName("A");
//         cls.setGrade(grade);
//         cls.setTeacher(teacher);

//         classRepo.save(cls);

//         // =========================
//         // Students
//         // =========================

//         Student s0 = createStudent(
//                 "Demo Student",
//                 "student@timetable.lk",
//                 "student123",
//                 "Mala Perera",
//                 "Demo School",
//                 "Grade 6",
//                 "A",
//                 today.plusDays(1)
//         );

//         Student s1 = createStudent(
//                 "Amara Perera",
//                 "student1@timetable.lk",
//                 "student123",
//                 "Mala Perera",
//                 "Demo School",
//                 "Grade 6",
//                 "A",
//                 today.plusDays(15)
//         );

//         Student s2 = createStudent(
//                 "Kasun Silva",
//                 "student2@timetable.lk",
//                 "student123",
//                 "Mala Perera",
//                 "Demo School",
//                 "Grade 6",
//                 "A",
//                 today.plusDays(15)
//         );

//         Student s3 = createStudent(
//                 "Nimali Fernando",
//                 "student3@timetable.lk",
//                 "student123",
//                 "Mala Perera",
//                 "Demo School",
//                 "Grade 6",
//                 "A",
//                 today.plusDays(15)
//         );

//         Student s4 = createStudent(
//                 "Isuru Jayasinghe",
//                 "student4@timetable.lk",
//                 "student123",
//                 "Mala Perera",
//                 "Demo School",
//                 "Grade 6",
//                 "A",
//                 today.plusDays(15)
//         );

//         Student s5 = createStudent(
//                 "Sahan Wickrama",
//                 "student5@timetable.lk",
//                 "student123",
//                 "Mala Perera",
//                 "Demo School",
//                 "Grade 6",
//                 "A",
//                 today.plusDays(15)
//         );

//         Student s6 = createStudent(
//                 "Tharindu Silva",
//                 "student6@timetable.lk",
//                 "student123",
//                 "Mala Perera",
//                 "Demo School",
//                 "Grade 6",
//                 "A",
//                 today.plusDays(15)
//         );

//         Student s7 = createStudent(
//                 "Dinuka Perera",
//                 "student7@timetable.lk",
//                 "student123",
//                 "Mala Perera",
//                 "Demo School",
//                 "Grade 6",
//                 "A",
//                 today.plusDays(15)
//         );

//         Student s8 = createStudent(
//                 "Rashmi Perera",
//                 "student8@timetable.lk",
//                 "student123",
//                 "Mala Perera",
//                 "Demo School",
//                 "Grade 6",
//                 "A",
//                 today.plusDays(15)
//         );

//         Student s9 = createStudent(
//                 "Janith Fernando",
//                 "student9@timetable.lk",
//                 "student123",
//                 "Mala Perera",
//                 "Demo School",
//                 "Grade 6",
//                 "A",
//                 today.plusDays(15)
//         );

//         List<Student> students = List.of(
//                 s0,
//                 s1,
//                 s2,
//                 s3,
//                 s4,
//                 s5,
//                 s6,
//                 s7,
//                 s8,
//                 s9
//         );

//         // =========================
//         // Teacher-Student Links
//         // =========================

//         for (Student s : students) {

//             TeacherStudent ts = new TeacherStudent();

//             ts.setTeacher(teacher);
//             ts.setStudent(s);
//             ts.setLinkedAt(Instant.now());

//             teacherStudentRepo.save(ts);
//         }

//         // =========================
//         // Activities
//         // =========================

//         List<String> subjects = List.of(
//                 "Mathematics",
//                 "Science",
//                 "English",
//                 "Sinhala",
//                 "History",
//                 "ICT",
//                 "Buddhism"
//         );

//         List<String> teacherComments = List.of(
//                 "Good work",
//                 "Keep improving",
//                 "Very good",
//                 "Nice effort",
//                 "Focus more on time management"
//         );

//         List<String> parentComments = List.of(
//                 "Well done",
//                 "Good progress",
//                 "Please keep consistency",
//                 "Excellent",
//                 "Try to start earlier"
//         );

//         Random rnd = new Random(357214);

//         LocalDate start =
//                 today.minusDays(29);

//         for (Student s : students) {

//             for (int day = 0; day < 30; day++) {

//                 LocalDate d =
//                         start.plusDays(day);

//                 int count =
//                         rnd.nextInt(3);

//                 for (int i = 0; i < count; i++) {

//                     String subject =
//                             subjects.get(
//                                     rnd.nextInt(
//                                             subjects.size()
//                                     )
//                             );

//                     LocalTime st =
//                             LocalTime.of(
//                                     16 + rnd.nextInt(3),
//                                     rnd.nextBoolean()
//                                             ? 0
//                                             : 30
//                             );

//                     int durationMin =
//                             List.of(
//                                     30,
//                                     45,
//                                     60,
//                                     75,
//                                     90
//                             ).get(
//                                     rnd.nextInt(5)
//                             );

//                     LocalTime et =
//                             st.plusMinutes(
//                                     durationMin
//                             );

//                     Activity a =
//                             new Activity();

//                     a.setStudent(s);
//                     a.setSubjectName(subject);
//                     a.setStartDate(d);
//                     a.setStartTime(st);
//                     a.setEndTime(et);
//                     a.setDurationMinutes(
//                             durationMin
//                     );

//                     a.setDescription(
//                             "Study session for "
//                                     + subject
//                     );

//                     int tRate =
//                             3 + rnd.nextInt(3);

//                     a.settRate(tRate);

//                     a.settComment(
//                             teacherComments.get(
//                                     rnd.nextInt(
//                                             teacherComments.size()
//                                     )
//                             )
//                     );

//                     int pRate =
//                             3 + rnd.nextInt(3);

//                     a.setpRate(pRate);

//                     a.setpComment(
//                             parentComments.get(
//                                     rnd.nextInt(
//                                             parentComments.size()
//                                     )
//                             )
//                     );

//                     activityRepo.save(a);
//                 }
//             }
//         }
//     }

//     private Student createStudent(
//             String name,
//             String email,
//             String rawPassword,
//             String guardianName,
//             String school,
//             String grade,
//             String className,
//             LocalDate expDate
//     ) {

//         Student s =
//                 new Student();

//         s.setName(name);

//         s.setEmail(
//                 email.toLowerCase().trim()
//         );

//         s.setPassword(
//                 encoder.encode(rawPassword)
//         );

//         s.setGuardianName(
//                 guardianName
//         );

//         s.setSchool(school);
//         s.setGrade(grade);
//         s.setClassName(className);
//         s.setTierExpDate(expDate);

//         return studentRepo.save(s);
//     }
// }