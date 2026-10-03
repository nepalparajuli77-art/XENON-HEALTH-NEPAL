package com.example.telemednepal.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.telemednepal.data.model.Doctor
import com.example.telemednepal.data.model.Language
import com.example.telemednepal.ui.theme.NepalCrimson
import com.example.telemednepal.ui.theme.NepalRoyalBlue
import com.example.telemednepal.ui.viewmodel.TelemedViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun BookAppointmentDialog(
    doctor: Doctor,
    viewModel: TelemedViewModel
) {
    val lang by viewModel.language.collectAsState()
    val user by viewModel.currentUser.collectAsState()

    var patientName by remember { mutableStateOf(user?.fullName ?: "") }
    var selectedDate by remember {
        val nextDay = System.currentTimeMillis() + 86400000L
        mutableStateOf(SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date(nextDay)))
    }
    var selectedTime by remember { mutableStateOf("11:00 AM") }
    var consultationType by remember { mutableStateOf("Video Consultation") }
    var symptoms by remember { mutableStateOf("") }

    val times = listOf("09:30 AM", "11:00 AM", "01:30 PM", "03:00 PM", "04:30 PM")

    Dialog(onDismissRequest = { viewModel.closeBooking() }) {
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp)
                .testTag("book_appointment_dialog")
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = if (lang == Language.NP) "अपोइन्टमेन्ट बुक गर्नुहोस्" else "Book Teleconsultation",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "${doctor.name} (${doctor.specialty})",
                    style = MaterialTheme.typography.bodyMedium,
                    color = NepalCrimson,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "${doctor.hospital} • Fee: NPR ${doctor.feeNpr}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )

                Spacer(modifier = Modifier.height(14.dp))
                OutlinedTextField(
                    value = patientName,
                    onValueChange = { patientName = it },
                    label = { Text(if (lang == Language.NP) "बिरामीको पूरा नाम" else "Patient Full Name") },
                    modifier = Modifier.fillMaxWidth().testTag("input_patient_name"),
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(10.dp))
                OutlinedTextField(
                    value = selectedDate,
                    onValueChange = { selectedDate = it },
                    label = { Text(if (lang == Language.NP) "मिति (YYYY-MM-DD)" else "Date (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth().testTag("input_appointment_date"),
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = if (lang == Language.NP) "समय छान्नुहोस्" else "Available Time Slot",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    times.take(3).forEach { t ->
                        FilterChip(
                            selected = selectedTime == t,
                            onClick = { selectedTime = t },
                            label = { Text(t, fontSize = 10.sp) }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = if (lang == Language.NP) "परामर्शको प्रकार" else "Consultation Type",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = consultationType == "Video Consultation",
                        onClick = { consultationType = "Video Consultation" },
                        label = { Text("Video Call") }
                    )
                    FilterChip(
                        selected = consultationType == "In-Person OPD",
                        onClick = { consultationType = "In-Person OPD" },
                        label = { Text("Hospital OPD") }
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))
                OutlinedTextField(
                    value = symptoms,
                    onValueChange = { symptoms = it },
                    label = { Text(if (lang == Language.NP) "लक्षण वा स्वास्थ्य समस्या" else "Symptoms / Reason for visit") },
                    modifier = Modifier.fillMaxWidth().testTag("input_symptoms"),
                    shape = RoundedCornerShape(8.dp),
                    maxLines = 3
                )

                Spacer(modifier = Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { viewModel.closeBooking() },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (lang == Language.NP) "रद्द" else "Cancel")
                    }

                    Button(
                        onClick = {
                            viewModel.bookAppointment(
                                doctor = doctor,
                                patientName = patientName,
                                date = selectedDate,
                                time = selectedTime,
                                type = consultationType,
                                symptoms = symptoms
                            )
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = NepalCrimson),
                        modifier = Modifier.weight(1.5f).testTag("btn_confirm_booking"),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (lang == Language.NP) "निश्चित गर्नुहोस्" else "Confirm Booking")
                    }
                }
            }
        }
    }
}
