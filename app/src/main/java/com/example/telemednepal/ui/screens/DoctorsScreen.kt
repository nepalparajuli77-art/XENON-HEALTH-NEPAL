package com.example.telemednepal.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.telemednepal.data.model.Doctor
import com.example.telemednepal.data.model.Language
import com.example.telemednepal.ui.theme.NepalCrimson
import com.example.telemednepal.ui.theme.NepalRoyalBlue
import com.example.telemednepal.ui.viewmodel.TelemedViewModel

@Composable
fun DoctorsScreen(viewModel: TelemedViewModel) {
    val lang by viewModel.language.collectAsState()
    val doctors by viewModel.filteredDoctors.collectAsState()
    val searchQuery by viewModel.doctorSearchQuery.collectAsState()
    val selectedSpecialty by viewModel.selectedSpecialty.collectAsState()
    val availableOnly by viewModel.availableOnly.collectAsState()

    val specialties = listOf(
        "All", "Gynecology", "Orthopedics", "Pediatrics", "Neurology",
        "Dermatology", "General Medicine", "Psychiatry", "Gastroenterology",
        "ENT", "Pulmonology", "Urology", "Ophthalmology", "Oncology",
        "Endocrinology", "Nephrology"
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp)
    ) {
        // Search Input
        item {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { viewModel.doctorSearchQuery.value = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("search_doctors_input"),
                placeholder = {
                    Text(
                        if (lang == Language.NP) "डाक्टरको नाम, विशेषज्ञता वा अस्पताल खोज्नुहोस्..."
                        else "Search by doctor name, specialty, hospital..."
                    )
                },
                leadingIcon = {
                    Icon(imageVector = Icons.Default.Search, contentDescription = "Search Doctors")
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { viewModel.doctorSearchQuery.value = "" }) {
                            Icon(imageVector = Icons.Default.Clear, contentDescription = "Clear search")
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = NepalCrimson,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outlineVariant
                )
            )
        }

        // Specialty Filter Chips
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                specialties.forEach { spec ->
                    FilterChip(
                        selected = selectedSpecialty == spec,
                        onClick = { viewModel.selectedSpecialty.value = spec },
                        label = { Text(spec, fontSize = 12.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = NepalCrimson,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }
        }

        // Available Only Filter Toggle
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${doctors.size} ${if (lang == Language.NP) "विशेषज्ञ डाक्टरहरू" else "Doctors Available"}",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )

                FilterChip(
                    selected = availableOnly,
                    onClick = { viewModel.availableOnly.value = !availableOnly },
                    label = { Text(if (lang == Language.NP) "आज उपलब्ध मात्र" else "Available Today Only", fontSize = 11.sp) },
                    leadingIcon = {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(if (availableOnly) Color.Green else Color.Gray)
                        )
                    }
                )
            }
        }

        if (doctors.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.SearchOff,
                            contentDescription = "No Doctors",
                            modifier = Modifier.size(48.dp),
                            tint = Color.Gray
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = if (lang == Language.NP) "कुनै डाक्टर भेटिएन" else "No doctors matched your criteria",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = if (lang == Language.NP) "कृपया फरक शब्द वा विभाग खोजी गर्नुहोस्।" else "Try adjusting your search terms or specialty filters.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray
                        )
                    }
                }
            }
        } else {
            items(doctors) { doctor ->
                DoctorCard(
                    doctor = doctor,
                    lang = lang,
                    onBook = { viewModel.openBooking(doctor) }
                )
            }
        }
    }
}

@Composable
fun DoctorCard(
    doctor: Doctor,
    lang: Language,
    onBook: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("doctor_card_${doctor.id}")
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(NepalCrimson.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = doctor.name.take(2).uppercase(),
                            color = NepalCrimson,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                    }
                    Column {
                        Text(
                            text = doctor.name,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = if (lang == Language.NP) doctor.specialtyNp else doctor.specialty,
                            style = MaterialTheme.typography.bodySmall,
                            color = NepalCrimson,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = doctor.hospital,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                            fontSize = 11.sp
                        )
                    }
                }

                Surface(
                    color = if (doctor.available) Color(0xFF10B981).copy(alpha = 0.15f) else Color.Gray.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = if (doctor.available)
                            (if (lang == Language.NP) "आज उपलब्ध" else "Available")
                        else
                            (if (lang == Language.NP) "व्यस्त" else "Busy"),
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                        color = if (doctor.available) Color(0xFF047857) else Color.DarkGray,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "${doctor.degrees} • ${doctor.experienceYears} ${if (lang == Language.NP) "वर्ष अनुभव" else "yrs exp"}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
            )

            Spacer(modifier = Modifier.height(4.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = "Rating",
                        tint = Color(0xFFF59E0B),
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = "${doctor.rating} (${doctor.reviewsCount})",
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Reg: ${doctor.nmcNumber}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray,
                        fontSize = 11.sp
                    )
                }

                Text(
                    text = "NPR ${doctor.feeNpr}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = NepalRoyalBlue
                )
            }

            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "🕒 ${doctor.schedule}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f),
                fontSize = 11.sp
            )

            Spacer(modifier = Modifier.height(12.dp))
            Button(
                onClick = onBook,
                colors = ButtonDefaults.buttonColors(containerColor = NepalCrimson),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("btn_book_${doctor.id}")
            ) {
                Icon(
                    imageVector = Icons.Default.CalendarToday,
                    contentDescription = "Book Now",
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(if (lang == Language.NP) "अपोइन्टमेन्ट बुक गर्नुहोस्" else "Book Teleconsultation")
            }
        }
    }
}
