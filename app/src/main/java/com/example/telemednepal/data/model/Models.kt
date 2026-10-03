package com.example.telemednepal.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class Language {
    EN, NP
}

@Entity(tableName = "doctors")
data class Doctor(
    @PrimaryKey val id: String,
    val name: String,
    val nmcNumber: String,
    val specialty: String,
    val specialtyNp: String,
    val hospitalId: String,
    val hospital: String,
    val degrees: String,
    val experienceYears: Int,
    val feeNpr: Int,
    val available: Boolean,
    val rating: Double,
    val reviewsCount: Int = 0,
    val languages: String = "Nepali, English",
    val schedule: String
)

@Entity(tableName = "hospitals")
data class Hospital(
    @PrimaryKey val id: String,
    val name: String,
    val nameNp: String,
    val address: String,
    val district: String,
    val phone: String,
    val emergency: String,
    val email: String,
    val type: String, // Private, Government, Teaching, Non-Profit
    val beds: Int,
    val icu: Boolean,
    val specialties: String,
    val open247: Boolean,
    val rating: Double,
    val description: String
)

data class Medicine(
    val name: String,
    val dosage: String,
    val frequency: String,
    val duration: String,
    val instructions: String
)

@Entity(tableName = "prescriptions")
data class Prescription(
    @PrimaryKey val id: String,
    val appointmentId: String? = null,
    val patientUsername: String,
    val patientName: String,
    val doctorId: String? = null,
    val doctorName: String,
    val specialty: String,
    val date: String,
    val diagnosis: String,
    val bp: String? = null,
    val pulse: String? = null,
    val weightKg: Int? = null,
    val spO2: String? = null,
    val medicinesSummary: String, // formatted medicines string
    val lifestyleAdvice: String,
    val followUpDate: String
)

@Entity(tableName = "appointments")
data class Appointment(
    @PrimaryKey val id: String,
    val patientUsername: String,
    val patientName: String,
    val doctorId: String,
    val doctorName: String,
    val specialty: String,
    val hospital: String,
    val date: String,
    val time: String,
    val type: String, // Video Consultation, In-Person OPD
    val status: String, // Confirmed, Pending, Completed, Cancelled
    val symptoms: String,
    val feeNpr: Int,
    val meetingLink: String? = null
)

data class EmergencyContact(
    val name: String,
    val nameNp: String,
    val number: String,
    val desc: String,
    val category: String, // air-ambulance, drone-delivery, national-helpline, police, mental-health
    val badge: String,
    val icon: String
)

@Entity(tableName = "users")
data class User(
    @PrimaryKey val id: String,
    val username: String,
    val role: String, // patient, doctor, admin
    val fullName: String,
    val phone: String,
    val email: String,
    val password: String = "1admin234",
    val bloodGroup: String? = null,
    val age: Int? = null,
    val gender: String? = null,
    val address: String? = null,
    val district: String? = null,
    val allergies: String? = null,
    val emergencyContact: String? = null,
    val nmcNumber: String? = null,
    val specialty: String? = null,
    val hospital: String? = null,
    val degrees: String? = null,
    val createdAt: String? = null
)

data class TriageResult(
    val reply: String,
    val severity: String, // critical, urgent, routine
    val firstAidSteps: List<String>,
    val recommendedSpecialty: String,
    val recommendedHospital: String
)

data class ChatMessage(
    val id: String = System.currentTimeMillis().toString(),
    val sender: String, // user, xenon, hospital
    val text: String,
    val time: String,
    val triage: TriageResult? = null
)
