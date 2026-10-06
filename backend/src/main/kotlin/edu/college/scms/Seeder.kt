package edu.college.scms

import org.springframework.boot.CommandLineRunner
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component

@Component
class Seeder(private val users: UserRepo, private val courses: CourseRepo,
             private val enrolls: EnrollmentRepo, private val enc: PasswordEncoder) : CommandLineRunner {

    override fun run(vararg args: String) {
        if (users.count() > 0) return
        users.save(User(name = "Admin", email = "admin@college.edu", password = enc.encode("admin123"), role = "ADMIN", department = "Administration"))

        val students = listOf(
            Triple("Rahul Sharma", "rahul@student.edu", "CSE"), Triple("Sai Kumar", "sai@student.edu", "AIML"),
            Triple("Priya Verma", "priya@student.edu", "CSE"), Triple("Ananya Rao", "ananya@student.edu", "ECE"),
            Triple("Karan Mehta", "karan@student.edu", "AIML")
        ).mapIndexed { i, (n, e, d) ->
            users.save(User(name = n, email = e, password = enc.encode("student123"), role = "STUDENT",
                rollNo = "22CS%03d".format(i + 1), department = d, academicYear = 2 + i % 3))
        }

        val cs = listOf(
            Course(code = "CS101", title = "Programming in Kotlin", department = "CSE", credits = 4, instructor = "Dr. Meera Nair", capacity = 60, description = "Kotlin basics, OOP and collections."),
            Course(code = "CS204", title = "Web Development with React", department = "CSE", credits = 3, instructor = "Prof. Arjun Das", capacity = 50, description = "Components, hooks and context."),
            Course(code = "CS310", title = "REST APIs with Spring Boot", department = "CSE", credits = 4, instructor = "Dr. Kavita Joshi", capacity = 40, description = "Controllers, JPA and JWT security."),
            Course(code = "AI201", title = "Machine Learning Basics", department = "AIML", credits = 3, instructor = "Dr. Rohan Iyer", capacity = 45, description = "Regression, classification and evaluation."),
            Course(code = "EC150", title = "Digital Electronics", department = "ECE", credits = 3, instructor = "Prof. Sunita Pillai", capacity = 55, description = "Logic gates, flip-flops and counters."),
            Course(code = "AI330", title = "Robotics Workshop", department = "AIML", credits = 2, instructor = "Dr. Vikram Sen", capacity = 2, description = "Hands-on robotics. Very limited seats.")
        ).map { courses.save(it) }

        students.forEachIndexed { i, s ->
            for (j in 0..2) {
                val marks = 55 + (i * 7 + j * 11) % 45
                enrolls.save(Enrollment(
                    student = s, course = cs[(i + j) % cs.size],
                    marks = if (j < 2) marks else null, grade = if (j < 2) gradeFor(marks) else null,
                    attendance = 65 + (i * 9 + j * 13) % 35
                ))
            }
        }
        println("Demo data loaded: admin@college.edu / admin123, rahul@student.edu / student123")
    }
}
