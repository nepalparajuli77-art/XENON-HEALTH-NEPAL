package com.example.telemednepal.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.telemednepal.data.model.Language
import com.example.telemednepal.ui.theme.NepalCrimson
import com.example.telemednepal.ui.viewmodel.TelemedViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun IssuePrescriptionDialog(viewModel: TelemedViewModel) {
    val lang by viewModel.language.collectAsState()
    val user by viewModel.currentUser.collectAsState()

    var patientName by remember { mutableStateOf("Nepal Parajuli") }
    var diagnosis by remember { mutableStateOf("Acute Upper Respiratory Infection & Seasonal Rhinitis") }
    var bp by remember { mutableStateOf("120/80 mmHg") }
    var pulse by remember { mutableStateOf("76 bpm") }
    var weightStr by remember { mutableStateOf("68") }
    var spO2 by remember { mutableStateOf("98%") }
    var medicines by remember {
        mutableStateOf("Paracetamol 650mg (TDS x 3 days) | Cetirizine 10mg (OD at bedtime x 5 days) | Steam inhalation TDS")
    }
    var advice by remember {
        mutableStateOf("Drink plenty of warm fluid. Rest adequately. Wear mask outdoors. Seek immediate review if breathlessness occurs.")
    }
    var followUpDate by remember {
        val nextWeek = System.currentTimeMillis() + (7L * 86400000L)
        mutableStateOf(SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date(nextWeek)))
    }

    Dialog(onDismissRequest = { viewModel.closeIssueRxDialog() }) {
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp)
                .testTag("issue_prescription_dialog")
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = if (lang == Language.NP) "डिजिटल प्रेस्क्रिप्सन जारी गर्नुहोस्" else "Issue Digital Prescription (Rx)",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Doctor: ${if (user?.role == "doctor") user?.fullName else "Dr. Sita Adhikari (MBBS, MD)"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = NepalCrimson
                )

                Spacer(modifier = Modifier.height(14.dp))
                OutlinedTextField(
                    value = patientName,
                    onValueChange = { patientName = it },
                    label = { Text("Patient Name") },
                    modifier = Modifier.fillMaxWidth().testTag("rx_patient_name"),
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(10.dp))
                OutlinedTextField(
                    value = diagnosis,
                    onValueChange = { diagnosis = it },
                    label = { Text("Clinical Diagnosis") },
                    modifier = Modifier.fillMaxWidth().testTag("rx_diagnosis"),
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = bp,
                        onValueChange = { bp = it },
                        label = { Text("BP", fontSize = 11.sp) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = pulse,
                        onValueChange = { pulse = it },
                        label = { Text("Pulse", fontSize = 11.sp) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = spO2,
                        onValueChange = { spO2 = it },
                        label = { Text("SpO2", fontSize = 11.sp) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))
                OutlinedTextField(
                    value = medicines,
                    onValueChange = { medicines = it },
                    label = { Text("Prescribed Medicines (Dosage & Instructions)") },
                    modifier = Modifier.fillMaxWidth().testTag("rx_medicines"),
                    shape = RoundedCornerShape(8.dp),
                    maxLines = 4
                )

                Spacer(modifier = Modifier.height(10.dp))
                OutlinedTextField(
                    value = advice,
                    onValueChange = { advice = it },
                    label = { Text("Doctor's Lifestyle & Dietary Advice") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    maxLines = 3
                )

                Spacer(modifier = Modifier.height(10.dp))
                OutlinedTextField(
                    value = followUpDate,
                    onValueChange = { followUpDate = it },
                    label = { Text("Next Follow-up Date (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { viewModel.closeIssueRxDialog() },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Cancel")
                    }

                    Button(
                        onClick = {
                            viewModel.issuePrescription(
                                patientName = patientName,
                                diagnosis = diagnosis,
                                bp = bp,
                                pulse = pulse,
                                weight = weightStr.toIntOrNull(),
                                spO2 = spO2,
                                medicines = medicines,
                                advice = advice,
                                followUp = followUpDate
                            )
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = NepalCrimson),
                        modifier = Modifier.weight(1.5f).testTag("btn_submit_rx"),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Issue Prescription")
                    }
                }
            }
        }
    }
}
