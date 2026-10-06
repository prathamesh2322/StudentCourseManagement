package edu.college.scms

import jakarta.persistence.*
import jakarta.validation.constraints.*
import org.springframework.data.jpa.repository.JpaRepository

// ---------- Entities (3 tables) ----------
@Entity @Table(name = "users")
class User(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) var id: Long = 0,
    var name: String = "",
    @Column(unique = true) var email: String = "",
    var password: String = "",
    var role: String = "STUDENT",          // ADMIN or STUDENT
    var rollNo: String = "",
    var department: String = "",
    var academicYear: Int = 1
)

@Entity @Table(name = "courses")
class Course(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) var id: Long = 0,
    @Column(unique = true) var code: String = "",
    var title: String = "",
    var department: String = "",
    var credits: Int = 3,
    var instructor: String = "",
    var capacity: Int = 60,
    @Column(length = 500) var description: String = ""
)

@Entity @Table(name = "enrollments")
class Enrollment(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) var id: Long = 0,
    @ManyToOne var student: User? = null,
    @ManyToOne var course: Course? = null,
    var status: String = "ENROLLED",       // ENROLLED or DROPPED
    var marks: Int? = null,
    var grade: String? = null,
    var attendance: Int = 100
)

// ---------- Repositories ----------
interface UserRepo : JpaRepository<User, Long> {
    fun findByEmail(email: String): User?
    fun existsByEmail(email: String): Boolean
    fun findByRole(role: String): List<User>
}

interface CourseRepo : JpaRepository<Course, Long> {
    fun findByCode(code: String): Course?
}

interface EnrollmentRepo : JpaRepository<Enrollment, Long> {
    fun findByStudentId(studentId: Long): List<Enrollment>
    fun findByCourseId(courseId: Long): List<Enrollment>
    fun findByStudentIdAndCourseId(studentId: Long, courseId: Long): Enrollment?
    fun countByCourseIdAndStatus(courseId: Long, status: String): Long
}

// ---------- DTOs ----------
data class UserDto(val id: Long, val name: String, val email: String, val role: String,
                   val rollNo: String, val department: String, val academicYear: Int)
data class StudentDto(val id: Long, val name: String, val email: String, val rollNo: String,
                      val department: String, val academicYear: Int, val enrolled: Int)
data class CourseDto(val id: Long, val code: String, val title: String, val department: String,
                     val credits: Int, val instructor: String, val capacity: Int,
                     val description: String, val enrolled: Int)
data class EnrollDto(val id: Long, val studentId: Long, val studentName: String, val rollNo: String,
                     val courseId: Long, val courseCode: String, val courseTitle: String,
                     val credits: Int, val instructor: String, val status: String,
                     val marks: Int?, val grade: String?, val attendance: Int)

fun User.toDto() = UserDto(id, name, email, role, rollNo, department, academicYear)
fun Enrollment.toDto() = EnrollDto(
    id, student!!.id, student!!.name, student!!.rollNo, course!!.id, course!!.code, course!!.title,
    course!!.credits, course!!.instructor, status, marks, grade, attendance
)

// ---------- Requests (validated) ----------
data class LoginReq(val email: String = "", val password: String = "")

data class UserReq(
    @field:Size(min = 3, message = "Name must be at least 3 characters") val name: String = "",
    @field:NotBlank(message = "Email is required") @field:Email(message = "Enter a valid email") val email: String = "",
    val password: String = "",
    val rollNo: String = "",
    val department: String = "",
    val academicYear: Int = 1
)

data class CourseReq(
    @field:NotBlank(message = "Course code is required") val code: String = "",
    @field:Size(min = 3, message = "Title must be at least 3 characters") val title: String = "",
    val department: String = "",
    @field:Min(value = 1, message = "Credits must be 1 to 6") @field:Max(value = 6, message = "Credits must be 1 to 6") val credits: Int = 3,
    val instructor: String = "",
    @field:Min(value = 1, message = "Capacity must be at least 1") val capacity: Int = 60,
    val description: String = ""
)

data class GradeReq(
    @field:Min(value = 0, message = "Marks must be 0 to 100") @field:Max(value = 100, message = "Marks must be 0 to 100") val marks: Int? = null,
    @field:Min(value = 0, message = "Attendance must be 0 to 100") @field:Max(value = 100, message = "Attendance must be 0 to 100") val attendance: Int? = null
)

// Kotlin `when` expression: marks -> letter grade
fun gradeFor(m: Int): String = when {
    m >= 90 -> "A+"
    m >= 80 -> "A"
    m >= 70 -> "B"
    m >= 60 -> "C"
    m >= 50 -> "D"
    else -> "F"
}
