package edu.college.scms

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class ScmsApplication

fun main(args: Array<String>) {
    runApplication<ScmsApplication>(*args)
}
