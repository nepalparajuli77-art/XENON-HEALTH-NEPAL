package com.example.telemednepal.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.telemednepal.data.model.Appointment
import com.example.telemednepal.data.model.Language
import com.example.telemednepal.data.model.Prescription
import com.example.telemednepal.ui.theme.NepalCrimson
import com.example.telemednepal.ui.theme.NepalRoyalBlue
import com.example.telemednepal.ui.viewmodel.TelemedViewModel

@Composable
fun PatientRecordsScreen(viewModel: TelemedViewModel) {
    val lang by viewModel.language.collectAsState()
    val appointments by viewModel.appointments.collectAsState()
    val prescriptions by viewModel.prescriptions.collectAsState()
    var selectedTab by remember { mutableIntStateOf(0) } // 0 = Appointments, 1 = Prescriptions

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp)
    ) {
        // Tab Selector Row & Action Button
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                TabRow(
                    selectedTabIndex = selectedTab,
                    modifier = Modifier.weight(1f),
                    containerColor = Color.Transparent,
                    divider = {}
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = {
                            Text(
                                text = if (lang == Language.NP) "परामर्शहरू (${appointments.size})" else "Consultations (${appointments.size})",
                                fontSize = 13.sp,
                                fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = {
                            Text(
                                text = if (lang == Language.NP) "प्रेस्क्रिप्सन (Rx) (${prescriptions.size})" else "Prescriptions (${prescriptions.size})",
                                fontSize = 13.sp,
                                fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))
                FilledTonalButton(
                    onClick = { viewModel.openIssueRxDialog() },
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.filledTonalButtonColors(containerColor = NepalCrimson.copy(alpha = 0.15f), contentColor = NepalCrimson),
                    modifier = Modifier.testTag("btn_open_issue_rx")
                ) {
                    Text("+ Issue Rx", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        if (selectedTab == 0) {
            // Appointments List
            if (appointments.isEmpty()) {
                item {
                    EmptyRecordCard(
                        title = if (lang == Language.NP) "कुनै परामर्श भेटिएन" else "No Consultations Found",
                        subtitle = if (lang == Language.NP) "नयाँ अपोइन्टमेन्ट लिन 'डाक्टरहरू' ट्याबमा जानुहोस्।" else "Book your first teleconsultation from Doctors directory."
                    )
                }
            } else {
                items(appointments) { appt ->
                    AppointmentDetailCard(
                        appointment = appt,
                        lang = lang,
                        onJoinVideo = { viewModel.openVideoRoom(appt) }
                    )
                }
            }
        } else {
            // Prescriptions List
            if (prescriptions.isEmpty()) {
                item {
                    EmptyRecordCard(
                        title = if (lang == Language.NP) "कुनै प्रेस्क्रिप्सन छैन" else "No Prescriptions Found",
                        subtitle = if (lang == Language.NP) "परामर्श पश्चात डाक्टरले यहाँ प्रेस्क्रिप्सन जारी गर्नुहुनेछ।" else "Prescriptions issued by your doctor will appear here."
                    )
                }
            } else {
                items(prescriptions) { rx ->
                    PrescriptionCard(prescription = rx, lang = lang)
                }
            }
        }
    }
}

@Composable
fun EmptyRecordCard(title: String, subtitle: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(imageVector = Icons.Default.Description, contentDescription = null, modifier = Modifier.size(48.dp), tint = Color.Gray)
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text(text = subtitle, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
        }
    }
}

@Composable
fun AppointmentDetailCard(
    appointment: Appointment,
    lang: Language,
    onJoinVideo: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth().testTag("appointment_detail_${appointment.id}")
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(text = appointment.doctorName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text(text = "${appointment.specialty} • ${appointment.hospital}", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                }
                Surface(
                    color = Color(0xFF10B981).copy(alpha = 0.15f),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = appointment.status,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        color = Color(0xFF047857),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                Text(text = "📅 ${appointment.date} at ${appointment.time}", style = MaterialTheme.typography.bodySmall)
                Text(text = "Fee: NPR ${appointment.feeNpr}", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold, color = NepalCrimson)
            }

            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Patient: ${appointment.patientName} | Symptoms: ${appointment.symptoms}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.75f)
            )

            Spacer(modifier = Modifier.height(12.dp))
            Button(
                onClick = onJoinVideo,
                colors = ButtonDefaults.buttonColors(containerColor = NepalRoyalBlue),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth().testTag("btn_enter_call_${appointment.id}")
            ) {
                Icon(imageVector = Icons.Default.Videocam, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(if (lang == Language.NP) "भिडियो कल सुरु गर्नुहोस्" else "Join Encrypted Video Call")
            }
        }
    }
}

@Composable
fun PrescriptionCard(prescription: Prescription, lang: Language) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth().testTag("rx_card_${prescription.id}")
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column {
                    Text(
                        text = "Digital Prescription (Rx)",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = NepalCrimson
                    )
                    Text(
                        text = "Issued by: ${prescription.doctorName} (${prescription.specialty})",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Medium
                    )
                }
                Text(text = prescription.date, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Diagnosis: ${prescription.diagnosis}",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold
            )

            // Vitals banner if present
            if (prescription.bp != null || prescription.pulse != null || prescription.spO2 != null) {
                Spacer(modifier = Modifier.height(6.dp))
                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(8.dp),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        prescription.bp?.let { Text(text = "BP: $it", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                        prescription.pulse?.let { Text(text = "Pulse: $it", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                        prescription.spO2?.let { Text(text = "SpO2: $it", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                        prescription.weightKg?.let { Text(text = "Weight: ${it}kg", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text(text = "Prescribed Medicines:", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
            Text(
                text = prescription.medicinesSummary,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.85f),
                lineHeight = 18.sp
            )

            if (prescription.lifestyleAdvice.isNotBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(text = "Doctor's Advice:", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                Text(text = prescription.lifestyleAdvice, style = MaterialTheme.typography.bodySmall, color = Color(0xFF0369A1))
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Next Follow-up Date: ${prescription.followUpDate}",
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray,
                fontSize = 11.sp
            )
        }
    }
}
