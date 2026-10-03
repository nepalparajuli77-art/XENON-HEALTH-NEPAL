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
import com.example.telemednepal.data.model.Doctor
import com.example.telemednepal.data.model.Language
import com.example.telemednepal.data.model.User
import com.example.telemednepal.ui.theme.NepalCrimson
import com.example.telemednepal.ui.theme.NepalRoyalBlue
import com.example.telemednepal.ui.viewmodel.TelemedViewModel

@Composable
fun AuthDialog(viewModel: TelemedViewModel) {
    val lang by viewModel.language.collectAsState()
    val initialMode by viewModel.authDialogMode.collectAsState()
    var mode by remember { mutableStateOf(initialMode) } // login, register-patient, register-doctor

    var usernameOrEmail by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var fullName by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var district by remember { mutableStateOf("Kathmandu") }
    var nmcNumber by remember { mutableStateOf("") }
    var specialty by remember { mutableStateOf("General Medicine") }
    var hospital by remember { mutableStateOf("Bir Hospital") }

    Dialog(onDismissRequest = { viewModel.closeAuthDialog() }) {
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp)
                .testTag("auth_dialog")
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = when (mode) {
                        "register-doctor" -> if (lang == Language.NP) "डाक्टर दर्ता (NMC Verified)" else "Register as Doctor (NMC)"
                        "register-patient" -> if (lang == Language.NP) "नागरिक दर्ता" else "Register as Patient"
                        else -> if (lang == Language.NP) "लग-इन (Login)" else "Login to Telemed Nepal"
                    },
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(10.dp))
                // Mode switcher chips
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    FilterChip(
                        selected = mode == "login",
                        onClick = { mode = "login" },
                        label = { Text("Login", fontSize = 11.sp) }
                    )
                    FilterChip(
                        selected = mode == "register-patient",
                        onClick = { mode = "register-patient" },
                        label = { Text("Patient Sign Up", fontSize = 11.sp) }
                    )
                    FilterChip(
                        selected = mode == "register-doctor",
                        onClick = { mode = "register-doctor" },
                        label = { Text("Doctor Sign Up", fontSize = 11.sp) }
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                if (mode != "login") {
                    OutlinedTextField(
                        value = fullName,
                        onValueChange = { fullName = it },
                        label = { Text("Full Name") },
                        modifier = Modifier.fillMaxWidth().testTag("auth_fullname"),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = { Text("Phone Number (+977)") },
                        modifier = Modifier.fillMaxWidth().testTag("auth_phone"),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }

                OutlinedTextField(
                    value = usernameOrEmail,
                    onValueChange = { usernameOrEmail = it },
                    label = { Text(if (mode == "login") "Username or Email (e.g. admin or patient_nepal)" else "Username") },
                    modifier = Modifier.fillMaxWidth().testTag("auth_username"),
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    modifier = Modifier.fillMaxWidth().testTag("auth_password"),
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true
                )

                if (mode == "register-doctor") {
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = nmcNumber,
                        onValueChange = { nmcNumber = it },
                        label = { Text("Nepal Medical Council (NMC) No.") },
                        modifier = Modifier.fillMaxWidth().testTag("auth_nmc"),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = specialty,
                        onValueChange = { specialty = it },
                        label = { Text("Medical Specialty") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = hospital,
                        onValueChange = { hospital = it },
                        label = { Text("Affiliated Hospital") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { viewModel.closeAuthDialog() },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Cancel")
                    }

                    Button(
                        onClick = {
                            when (mode) {
                                "login" -> {
                                    viewModel.login(usernameOrEmail.ifBlank { "patient_nepal" }, password)
                                }
                                "register-patient" -> {
                                    val newUser = User(
                                        id = "usr_${System.currentTimeMillis()}",
                                        username = usernameOrEmail.ifBlank { "citizen_${System.currentTimeMillis()}" },
                                        role = "patient",
                                        fullName = fullName.ifBlank { "Nepal Citizen" },
                                        phone = phone.ifBlank { "+977-9800000000" },
                                        email = "$usernameOrEmail@telemed.np",
                                        district = district
                                    )
                                    viewModel.registerPatient(newUser)
                                }
                                "register-doctor" -> {
                                    val newDocId = "doc_${System.currentTimeMillis()}"
                                    val newDoc = Doctor(
                                        id = newDocId,
                                        name = fullName.ifBlank { "Dr. Specialist" },
                                        nmcNumber = nmcNumber.ifBlank { "NMC-9999" },
                                        specialty = specialty,
                                        specialtyNp = specialty,
                                        hospitalId = "hosp_001",
                                        hospital = hospital,
                                        degrees = "MBBS, MD",
                                        experienceYears = 5,
                                        feeNpr = 800,
                                        available = true,
                                        rating = 5.0,
                                        schedule = "Sun - Fri (10:00 AM - 04:00 PM)"
                                    )
                                    val newUser = User(
                                        id = "usr_${System.currentTimeMillis()}",
                                        username = usernameOrEmail.ifBlank { "dr_${System.currentTimeMillis()}" },
                                        role = "doctor",
                                        fullName = fullName.ifBlank { "Dr. Specialist" },
                                        phone = phone.ifBlank { "+977-9800000000" },
                                        email = "$usernameOrEmail@telemed.np",
                                        nmcNumber = nmcNumber,
                                        specialty = specialty,
                                        hospital = hospital
                                    )
                                    viewModel.registerDoctor(newDoc, newUser)
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = NepalRoyalBlue),
                        modifier = Modifier.weight(1.5f).testTag("btn_auth_submit"),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(if (mode == "login") "Login" else "Register")
                    }
                }
            }
        }
    }
}
