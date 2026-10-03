package com.example.telemednepal.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.telemednepal.data.model.Hospital
import com.example.telemednepal.data.model.Language
import com.example.telemednepal.ui.theme.NepalCrimson
import com.example.telemednepal.ui.theme.NepalRoyalBlue
import com.example.telemednepal.ui.viewmodel.TelemedViewModel

@Composable
fun HospitalsScreen(viewModel: TelemedViewModel) {
    val context = LocalContext.current
    val lang by viewModel.language.collectAsState()
    val hospitals by viewModel.filteredHospitals.collectAsState()
    val searchQuery by viewModel.hospitalSearchQuery.collectAsState()
    val selectedType by viewModel.selectedHospitalType.collectAsState()
    val h247Only by viewModel.hospital247Only.collectAsState()
    val icuOnly by viewModel.hospitalIcuOnly.collectAsState()

    val hospitalTypes = listOf("All", "Government", "Private", "Teaching", "Non-Profit")

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
                onValueChange = { viewModel.hospitalSearchQuery.value = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("search_hospitals_input"),
                placeholder = {
                    Text(
                        if (lang == Language.NP) "अस्पतालको नाम, जिल्ला वा विभाग खोज्नुहोस्..."
                        else "Search hospital by name, district, or specialty..."
                    )
                },
                leadingIcon = {
                    Icon(imageVector = Icons.Default.Search, contentDescription = "Search Hospitals")
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { viewModel.hospitalSearchQuery.value = "" }) {
                            Icon(imageVector = Icons.Default.Clear, contentDescription = "Clear search")
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = NepalRoyalBlue,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outlineVariant
                )
            )
        }

        // Type Filter Chips & Badges
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                hospitalTypes.forEach { type ->
                    FilterChip(
                        selected = selectedType == type,
                        onClick = { viewModel.selectedHospitalType.value = type },
                        label = { Text(type, fontSize = 12.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = NepalRoyalBlue,
                            selectedLabelColor = Color.White
                        )
                    )
                }

                FilterChip(
                    selected = h247Only,
                    onClick = { viewModel.hospital247Only.value = !h247Only },
                    label = { Text(if (lang == Language.NP) "२४/७ सेवा" else "24/7 Open", fontSize = 12.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = Color(0xFF059669),
                        selectedLabelColor = Color.White
                    )
                )

                FilterChip(
                    selected = icuOnly,
                    onClick = { viewModel.hospitalIcuOnly.value = !icuOnly },
                    label = { Text(if (lang == Language.NP) "आईसीयू उपलब्ध" else "ICU Available", fontSize = 12.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = NepalCrimson,
                        selectedLabelColor = Color.White
                    )
                )
            }
        }

        item {
            Text(
                text = "${hospitals.size} ${if (lang == Language.NP) "आबद्ध अस्पतालहरू" else "Partner Hospitals Found"}",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )
        }

        if (hospitals.isEmpty()) {
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
                            imageVector = Icons.Default.Apartment,
                            contentDescription = "No Hospitals",
                            modifier = Modifier.size(48.dp),
                            tint = Color.Gray
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = if (lang == Language.NP) "कुनै अस्पताल फेला परेन" else "No hospitals matched your search",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        } else {
            items(hospitals) { hospital ->
                HospitalCard(
                    hospital = hospital,
                    lang = lang,
                    onChat = { viewModel.openHospitalChat(hospital) },
                    onCallEmergency = {
                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${hospital.emergency}"))
                        context.startActivity(intent)
                    }
                )
            }
        }
    }
}

@Composable
fun HospitalCard(
    hospital: Hospital,
    lang: Language,
    onChat: () -> Unit,
    onCallEmergency: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("hospital_card_${hospital.id}")
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = if (lang == Language.NP) hospital.nameNp else hospital.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "📍 ${hospital.address} (${hospital.district})",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                }

                Surface(
                    color = NepalRoyalBlue.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = hospital.type,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                        color = NepalRoyalBlue,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = hospital.description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.85f),
                lineHeight = 16.sp
            )

            Spacer(modifier = Modifier.height(8.dp))
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (hospital.open247) {
                    Surface(
                        color = Color(0xFF10B981).copy(alpha = 0.15f),
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(
                            text = "✓ 24/7 Open",
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                            color = Color(0xFF047857),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                if (hospital.icu) {
                    Surface(
                        color = NepalCrimson.copy(alpha = 0.15f),
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(
                            text = "ICU Available",
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                            color = NepalCrimson,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = "${hospital.beds} Beds",
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Specialties: ${hospital.specialties}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                fontSize = 11.sp
            )

            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onCallEmergency,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = NepalCrimson),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f).testTag("btn_call_emergency_${hospital.id}")
                ) {
                    Icon(imageVector = Icons.Default.Call, contentDescription = "Emergency", modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(if (lang == Language.NP) "इमर्जेन्सी कल" else "Emergency", fontSize = 12.sp)
                }

                Button(
                    onClick = onChat,
                    colors = ButtonDefaults.buttonColors(containerColor = NepalRoyalBlue),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1.2f).testTag("btn_hospital_chat_${hospital.id}")
                ) {
                    Icon(imageVector = Icons.Default.Chat, contentDescription = "Helpdesk", modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(if (lang == Language.NP) "प्रत्यक्ष च्याट" else "Live Helpdesk", fontSize = 12.sp)
                }
            }
        }
    }
}
