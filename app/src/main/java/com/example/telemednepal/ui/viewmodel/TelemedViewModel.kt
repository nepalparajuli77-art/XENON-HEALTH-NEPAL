package com.example.telemednepal.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.telemednepal.data.model.Appointment
import com.example.telemednepal.data.model.ChatMessage
import com.example.telemednepal.data.model.Doctor
import com.example.telemednepal.data.model.Hospital
import com.example.telemednepal.data.model.Language
import com.example.telemednepal.data.model.Prescription
import com.example.telemednepal.data.model.User
import com.example.telemednepal.data.repository.TelemedRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

enum class AppTab {
    DASHBOARD, DOCTORS, HOSPITALS, RECORDS, EMERGENCY, XENON_AI
}

class TelemedViewModel(private val repository: TelemedRepository) : ViewModel() {

    private val _language = MutableStateFlow(Language.EN)
    val language: StateFlow<Language> = _language.asStateFlow()

    private val _isDarkMode = MutableStateFlow(false)
    val isDarkMode: StateFlow<Boolean> = _isDarkMode.asStateFlow()

    private val _currentTab = MutableStateFlow(AppTab.DASHBOARD)
    val currentTab: StateFlow<AppTab> = _currentTab.asStateFlow()

    val currentUser: StateFlow<User?> = repository.currentUser.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        null
    )

    val emergencyContacts = repository.emergencyContacts

    // Search and filter states
    val doctorSearchQuery = MutableStateFlow("")
    val selectedSpecialty = MutableStateFlow("All")
    val availableOnly = MutableStateFlow(false)

    val filteredDoctors: StateFlow<List<Doctor>> = combine(
        repository.doctors,
        doctorSearchQuery,
        selectedSpecialty,
        availableOnly
    ) { docs, query, specialty, availOnly ->
        docs.filter { doc ->
            val matchesQuery = query.isBlank() ||
                    doc.name.contains(query, ignoreCase = true) ||
                    doc.specialty.contains(query, ignoreCase = true) ||
                    doc.hospital.contains(query, ignoreCase = true) ||
                    doc.degrees.contains(query, ignoreCase = true)
            val matchesSpecialty = specialty == "All" || doc.specialty.contains(specialty, ignoreCase = true)
            val matchesAvail = !availOnly || doc.available
            matchesQuery && matchesSpecialty && matchesAvail
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val hospitalSearchQuery = MutableStateFlow("")
    val selectedHospitalType = MutableStateFlow("All")
    val hospital247Only = MutableStateFlow(false)
    val hospitalIcuOnly = MutableStateFlow(false)

    val filteredHospitals: StateFlow<List<Hospital>> = combine(
        repository.hospitals,
        hospitalSearchQuery,
        selectedHospitalType,
        combine(hospital247Only, hospitalIcuOnly) { h247, icu -> Pair(h247, icu) }
    ) { hosps, query, type, (h247, icu) ->
        hosps.filter { hosp ->
            val matchesQuery = query.isBlank() ||
                    hosp.name.contains(query, ignoreCase = true) ||
                    hosp.district.contains(query, ignoreCase = true) ||
                    hosp.specialties.contains(query, ignoreCase = true)
            val matchesType = type == "All" || hosp.type.equals(type, ignoreCase = true)
            val matches247 = !h247 || hosp.open247
            val matchesIcu = !icu || hosp.icu
            matchesQuery && matchesType && matches247 && matchesIcu
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val appointments: StateFlow<List<Appointment>> = repository.appointments.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        emptyList()
    )

    val prescriptions: StateFlow<List<Prescription>> = repository.prescriptions.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        emptyList()
    )

    // Dialog and Modal States
    val selectedDoctorForBooking = MutableStateFlow<Doctor?>(null)
    val selectedHospitalForChat = MutableStateFlow<Hospital?>(null)
    val activeVideoAppointment = MutableStateFlow<Appointment?>(null)
    val isIssueRxDialogOpen = MutableStateFlow(false)
    val isAuthDialogOpen = MutableStateFlow(false)
    val authDialogMode = MutableStateFlow("login") // login, register-patient, register-doctor
    val toastMessage = MutableStateFlow<String?>(null)

    // Xenon AI Chat State
    private val _xenonMessages = MutableStateFlow<List<ChatMessage>>(
        listOf(
            ChatMessage(
                sender = "xenon",
                text = "Namaste! I am Xenon AI (जिनोन एआई), Nepal's clinical triage medical intelligence assistant. How can I assist with your symptoms or health queries today?",
                time = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())
            )
        )
    )
    val xenonMessages: StateFlow<List<ChatMessage>> = _xenonMessages.asStateFlow()

    fun setLanguage(lang: Language) {
        _language.value = lang
    }

    fun toggleDarkMode() {
        _isDarkMode.value = !_isDarkMode.value
    }

    fun setCurrentTab(tab: AppTab) {
        _currentTab.value = tab
    }

    fun showToast(msg: String) {
        toastMessage.value = msg
    }

    fun clearToast() {
        toastMessage.value = null
    }

    fun openBooking(doctor: Doctor) {
        selectedDoctorForBooking.value = doctor
    }

    fun closeBooking() {
        selectedDoctorForBooking.value = null
    }

    fun openHospitalChat(hospital: Hospital) {
        selectedHospitalForChat.value = hospital
    }

    fun closeHospitalChat() {
        selectedHospitalForChat.value = null
    }

    fun openVideoRoom(appointment: Appointment) {
        activeVideoAppointment.value = appointment
    }

    fun closeVideoRoom() {
        activeVideoAppointment.value = null
    }

    fun openIssueRxDialog() {
        isIssueRxDialogOpen.value = true
    }

    fun closeIssueRxDialog() {
        isIssueRxDialogOpen.value = false
    }

    fun openAuthDialog(mode: String = "login") {
        authDialogMode.value = mode
        isAuthDialogOpen.value = true
    }

    fun closeAuthDialog() {
        isAuthDialogOpen.value = false
    }

    fun sendXenonMessage(text: String) {
        if (text.isBlank()) return
        val timeNow = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())
        val userMsg = ChatMessage(sender = "user", text = text, time = timeNow)
        val current = _xenonMessages.value.toMutableList()
        current.add(userMsg)
        _xenonMessages.value = current

        viewModelScope.launch {
            val triage = repository.evaluateClinicalTriage(text, _language.value)
            val replyMsg = ChatMessage(
                sender = "xenon",
                text = triage.reply,
                time = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date()),
                triage = triage
            )
            val updated = _xenonMessages.value.toMutableList()
            updated.add(replyMsg)
            _xenonMessages.value = updated
        }
    }

    fun bookAppointment(
        doctor: Doctor,
        patientName: String,
        date: String,
        time: String,
        type: String,
        symptoms: String
    ) {
        viewModelScope.launch {
            val user = currentUser.value
            val newAppt = Appointment(
                id = "apt_${System.currentTimeMillis()}",
                patientUsername = user?.username ?: "guest_patient",
                patientName = patientName.ifBlank { user?.fullName ?: "Patient" },
                doctorId = doctor.id,
                doctorName = doctor.name,
                specialty = doctor.specialty,
                hospital = doctor.hospital,
                date = date,
                time = time,
                type = type,
                status = "Confirmed",
                symptoms = symptoms.ifBlank { "Teleconsultation request" },
                feeNpr = doctor.feeNpr,
                meetingLink = "https://telemednepal.org.np/room/nep-${System.currentTimeMillis()}"
            )
            repository.bookAppointment(newAppt)
            closeBooking()
            showToast("Appointment successfully booked with ${doctor.name}!")
        }
    }

    fun issuePrescription(
        patientName: String,
        diagnosis: String,
        bp: String,
        pulse: String,
        weight: Int?,
        spO2: String,
        medicines: String,
        advice: String,
        followUp: String
    ) {
        viewModelScope.launch {
            val user = currentUser.value
            val newRx = Prescription(
                id = "rx_${System.currentTimeMillis()}",
                patientUsername = "patient_nepal",
                patientName = patientName,
                doctorId = user?.id ?: "doc_002",
                doctorName = if (user?.role == "doctor") user.fullName else "Dr. Sita Adhikari",
                specialty = user?.specialty ?: "General & Family Medicine",
                date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
                diagnosis = diagnosis,
                bp = bp.ifBlank { null },
                pulse = pulse.ifBlank { null },
                weightKg = weight,
                spO2 = spO2.ifBlank { null },
                medicinesSummary = medicines,
                lifestyleAdvice = advice,
                followUpDate = followUp
            )
            repository.issuePrescription(newRx)
            closeIssueRxDialog()
            showToast("Prescription issued for $patientName!")
        }
    }

    fun login(username: String, pass: String) {
        viewModelScope.launch {
            val res = repository.login(username, pass)
            res.onSuccess {
                closeAuthDialog()
                showToast("Welcome, ${it.fullName}! Logged in as ${it.role}.")
            }.onFailure {
                showToast("Login failed: ${it.message}")
            }
        }
    }

    fun registerPatient(user: User) {
        viewModelScope.launch {
            val res = repository.registerPatient(user)
            res.onSuccess {
                closeAuthDialog()
                showToast("Patient registration complete! Welcome, ${it.fullName}.")
            }
        }
    }

    fun registerDoctor(doctor: Doctor, user: User) {
        viewModelScope.launch {
            val res = repository.registerDoctor(doctor, user)
            res.onSuccess {
                closeAuthDialog()
                showToast("Doctor registration submitted! Welcome, ${doctor.name}.")
            }
        }
    }

    fun switchRole(role: String) {
        repository.switchUserRole(role)
        showToast("Switched role to $role")
    }

    fun logout() {
        repository.logout()
        showToast("Logged out successfully.")
    }
}
