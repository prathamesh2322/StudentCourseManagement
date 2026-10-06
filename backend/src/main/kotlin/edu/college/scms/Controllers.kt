package edu.college.scms

import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.resource.NoResourceFoundException

// ---------- Custom exception + global handler ----------
class ApiException(val status: HttpStatus, message: String) : RuntimeException(message)

@RestControllerAdvice
class Errors {
    @ExceptionHandler(ApiException::class)
    fun api(e: ApiException) = ResponseEntity.status(e.status).body(mapOf("message" to e.message))

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun invalid(e: MethodArgumentNotValidException) = ResponseEntity.badRequest()
        .body(mapOf("message" to e.bindingResult.fieldErrors.joinToString(", ") { it.defaultMessage ?: "Invalid value" }))

    @ExceptionHandler(AccessDeniedException::class)
    fun denied(e: AccessDeniedException) = ResponseEntity.status(HttpStatus.FORBIDDEN).body(mapOf("message" to "Access denied for your role"))

    @ExceptionHandler(NoResourceFoundException::class)
    fun notFound(e: NoResourceFoundException) = ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("message" to "Not found"))

    @ExceptionHandler(Exception::class)
    fun other(e: Exception) = ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("message" to (e.message ?: "Server error")))
}

@Component
class Me(private val users: UserRepo) {
    fun get(): User {
        val email = SecurityContextHolder.getContext().authentication?.name
            ?: throw ApiException(HttpStatus.UNAUTHORIZED, "Please log in")
        return users.findByEmail(email) ?: throw ApiException(HttpStatus.UNAUTHORIZED, "User not found")
    }
}

@RestController
class HealthController {
    @GetMapping("/api/health")
    fun health() = mapOf("status" to "UP", "app" to "SCMS")
}

// ---------- Auth ----------
@RestController @RequestMapping("/api/auth")
class AuthController(private val users: UserRepo, private val enc: PasswordEncoder, private val jwt: JwtUtil) {

    @PostMapping("/login")
    fun login(@RequestBody r: LoginReq): Map<String, Any> {
        val u = users.findByEmail(r.email.trim().lowercase())
            ?: throw ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password")
        if (!enc.matches(r.password, u.password)) throw ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password")
        return mapOf("token" to jwt.generate(u.email, u.role), "user" to u.toDto())
    }

    @PostMapping("/register")
    fun register(@Valid @RequestBody r: UserReq): Map<String, Any> {
        if (r.password.length < 6) throw ApiException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters")
        val email = r.email.trim().lowercase()
        if (users.existsByEmail(email)) throw ApiException(HttpStatus.CONFLICT, "Email is already registered")
        val u = users.save(User(name = r.name.trim(), email = email, password = enc.encode(r.password), role = "STUDENT",
            rollNo = r.rollNo.trim(), department = r.department, academicYear = r.academicYear))
        return mapOf("token" to jwt.generate(u.email, u.role), "user" to u.toDto())
    }
}

// ---------- Courses ----------
@RestController @RequestMapping("/api/courses")
class CourseController(private val courses: CourseRepo, private val enrolls: EnrollmentRepo) {

    private fun dto(c: Course) = CourseDto(c.id, c.code, c.title, c.department, c.credits, c.instructor, c.capacity,
        c.description, enrolls.countByCourseIdAndStatus(c.id, "ENROLLED").toInt())

    private fun fill(c: Course, r: CourseReq): CourseDto {
        val code = r.code.trim().uppercase()
        val dup = courses.findByCode(code)
        if (dup != null && dup.id != c.id) throw ApiException(HttpStatus.CONFLICT, "Course code $code already exists")
        c.code = code; c.title = r.title.trim(); c.department = r.department; c.credits = r.credits
        c.instructor = r.instructor.trim(); c.capacity = r.capacity; c.description = r.description.trim()
        return dto(courses.save(c))
    }

    @GetMapping
    fun all(): List<CourseDto> = courses.findAll().sortedBy { it.code }.map { dto(it) }

    @PostMapping @PreAuthorize("hasRole('ADMIN')")
    fun create(@Valid @RequestBody r: CourseReq) = fill(Course(), r)

    @PutMapping("/{id}") @PreAuthorize("hasRole('ADMIN')")
    fun update(@PathVariable id: Long, @Valid @RequestBody r: CourseReq): CourseDto {
        val c = courses.findById(id).orElseThrow { ApiException(HttpStatus.NOT_FOUND, "Course not found") }
        return fill(c, r)
    }

    @DeleteMapping("/{id}") @PreAuthorize("hasRole('ADMIN')")
    fun delete(@PathVariable id: Long): Map<String, String> {
        if (!courses.existsById(id)) throw ApiException(HttpStatus.NOT_FOUND, "Course not found")
        enrolls.deleteAll(enrolls.findByCourseId(id))
        courses.deleteById(id)
        return mapOf("message" to "Course deleted")
    }
}

// ---------- Students (admin only) ----------
@RestController @RequestMapping("/api/students") @PreAuthorize("hasRole('ADMIN')")
class StudentController(private val users: UserRepo, private val enrolls: EnrollmentRepo, private val enc: PasswordEncoder) {

    private fun dto(u: User) = StudentDto(u.id, u.name, u.email, u.rollNo, u.department, u.academicYear,
        enrolls.findByStudentId(u.id).count { it.status == "ENROLLED" })

    @GetMapping
    fun all(): List<StudentDto> = users.findByRole("STUDENT").sortedBy { it.rollNo }.map { dto(it) }

    @PostMapping
    fun create(@Valid @RequestBody r: UserReq): StudentDto {
        if (r.password.length < 6) throw ApiException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters")
        val email = r.email.trim().lowercase()
        if (users.existsByEmail(email)) throw ApiException(HttpStatus.CONFLICT, "Email is already registered")
        return dto(users.save(User(name = r.name.trim(), email = email, password = enc.encode(r.password), role = "STUDENT",
            rollNo = r.rollNo.trim(), department = r.department, academicYear = r.academicYear)))
    }

    @PutMapping("/{id}")
    fun update(@PathVariable id: Long, @Valid @RequestBody r: UserReq): StudentDto {
        val u = users.findById(id).orElseThrow { ApiException(HttpStatus.NOT_FOUND, "Student not found") }
        val email = r.email.trim().lowercase()
        val dup = users.findByEmail(email)
        if (dup != null && dup.id != id) throw ApiException(HttpStatus.CONFLICT, "Email is already registered")
        u.name = r.name.trim(); u.email = email; u.rollNo = r.rollNo.trim(); u.department = r.department; u.academicYear = r.academicYear
        if (r.password.isNotBlank()) {
            if (r.password.length < 6) throw ApiException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters")
            u.password = enc.encode(r.password)
        }
        return dto(users.save(u))
    }

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Long): Map<String, String> {
        val u = users.findById(id).orElseThrow { ApiException(HttpStatus.NOT_FOUND, "Student not found") }
        if (u.role != "STUDENT") throw ApiException(HttpStatus.BAD_REQUEST, "Only students can be deleted")
        enrolls.deleteAll(enrolls.findByStudentId(id))
        users.delete(u)
        return mapOf("message" to "Student deleted")
    }
}

// ---------- Enrollments, marks and attendance ----------
@RestController @RequestMapping("/api/enrollments")
class EnrollmentController(private val enrolls: EnrollmentRepo, private val courses: CourseRepo, private val me: Me) {

    @GetMapping("/my") @PreAuthorize("hasRole('STUDENT')")
    fun mine(): List<EnrollDto> = enrolls.findByStudentId(me.get().id).filter { it.status == "ENROLLED" }.map { it.toDto() }

    @GetMapping @PreAuthorize("hasRole('ADMIN')")
    fun all(@RequestParam(required = false) courseId: Long?): List<EnrollDto> =
        (if (courseId != null) enrolls.findByCourseId(courseId) else enrolls.findAll())
            .filter { it.status == "ENROLLED" }.sortedBy { it.student!!.rollNo }.map { it.toDto() }

    @PostMapping("/{courseId}") @PreAuthorize("hasRole('STUDENT')")
    fun enroll(@PathVariable courseId: Long): EnrollDto {
        val s = me.get()
        val c = courses.findById(courseId).orElseThrow { ApiException(HttpStatus.NOT_FOUND, "Course not found") }
        val existing = enrolls.findByStudentIdAndCourseId(s.id, courseId)
        if (existing?.status == "ENROLLED") throw ApiException(HttpStatus.CONFLICT, "You are already enrolled in ${c.code}")
        if (enrolls.countByCourseIdAndStatus(courseId, "ENROLLED") >= c.capacity)
            throw ApiException(HttpStatus.CONFLICT, "${c.code} is full. No seats left.")
        val e = existing ?: Enrollment(student = s, course = c)
        e.status = "ENROLLED"
        return enrolls.save(e).toDto()
    }

    @DeleteMapping("/{id}") @PreAuthorize("hasRole('STUDENT')")
    fun drop(@PathVariable id: Long): Map<String, String> {
        val e = enrolls.findById(id).orElseThrow { ApiException(HttpStatus.NOT_FOUND, "Enrollment not found") }
        if (e.student!!.id != me.get().id) throw ApiException(HttpStatus.FORBIDDEN, "This is not your enrollment")
        e.status = "DROPPED"
        enrolls.save(e)
        return mapOf("message" to "Course dropped")
    }

    @PutMapping("/{id}") @PreAuthorize("hasRole('ADMIN')")
    fun grade(@PathVariable id: Long, @Valid @RequestBody r: GradeReq): EnrollDto {
        val e = enrolls.findById(id).orElseThrow { ApiException(HttpStatus.NOT_FOUND, "Enrollment not found") }
        e.marks = r.marks
        e.grade = r.marks?.let { gradeFor(it) }
        if (r.attendance != null) e.attendance = r.attendance
        return enrolls.save(e).toDto()
    }
}

// ---------- Dashboards (Kotlin collection operations: filter, map, groupBy, sumOf) ----------
@RestController @RequestMapping("/api/dashboard")
class DashboardController(private val users: UserRepo, private val courses: CourseRepo,
                          private val enrolls: EnrollmentRepo, private val me: Me) {

    private val points = mapOf("A+" to 10, "A" to 9, "B" to 8, "C" to 7, "D" to 6, "F" to 0)

    @GetMapping("/admin") @PreAuthorize("hasRole('ADMIN')")
    fun admin(): Map<String, Any> {
        val active = enrolls.findAll().filter { it.status == "ENROLLED" }
        val students = users.findByRole("STUDENT")
        val cs = courses.findAll().sortedBy { it.code }
        val seats = cs.sumOf { it.capacity }
        val perCourse = cs.map { c -> mapOf("label" to c.code, "value" to active.count { it.course!!.id == c.id }, "total" to c.capacity) }
        val byDept = students.groupBy { it.department }.map { mapOf("label" to it.key, "value" to it.value.size) }
        val grades = active.mapNotNull { it.grade }.groupingBy { it }.eachCount().toSortedMap().map { mapOf("label" to it.key, "value" to it.value) }
        val avgAtt = if (active.isEmpty()) 0 else active.map { it.attendance }.average().toInt()
        return mapOf(
            "students" to students.size, "courses" to cs.size, "enrollments" to active.size,
            "avgAttendance" to avgAtt, "seatFill" to (if (seats == 0) 0 else active.size * 100 / seats),
            "perCourse" to perCourse, "byDept" to byDept, "grades" to grades,
            "recent" to active.sortedByDescending { it.id }.take(5).map { it.toDto() }
        )
    }

    @GetMapping("/student") @PreAuthorize("hasRole('STUDENT')")
    fun student(): Map<String, Any> {
        val mine = enrolls.findByStudentId(me.get().id).filter { it.status == "ENROLLED" }
        val graded = mine.filter { it.grade != null }
        val gradedCredits = graded.sumOf { it.course!!.credits }
        val gpa = if (gradedCredits == 0) 0.0 else
            Math.round(graded.sumOf { (points[it.grade ?: ""] ?: 0) * it.course!!.credits }.toDouble() / gradedCredits * 100) / 100.0
        val avgAtt = if (mine.isEmpty()) 0 else mine.map { it.attendance }.average().toInt()
        return mapOf(
            "enrolled" to mine.size, "credits" to mine.sumOf { it.course!!.credits }, "gpa" to gpa,
            "avgAttendance" to avgAtt, "lowAttendance" to mine.count { it.attendance < 75 },
            "courses" to mine.map { it.toDto() }
        )
    }
}
