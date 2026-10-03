package com.example.telemednepal.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.telemednepal.data.model.Appointment
import com.example.telemednepal.data.model.Language
import com.example.telemednepal.ui.theme.NepalCrimson
import com.example.telemednepal.ui.theme.NepalRoyalBlue
import com.example.telemednepal.ui.viewmodel.AppTab
import com.example.telemednepal.ui.viewmodel.TelemedViewModel

@Composable
fun DashboardScreen(viewModel: TelemedViewModel) {
    val context = LocalContext.current
    val lang by viewModel.language.collectAsState()
    val user by viewModel.currentUser.collectAsState()
    val appointments by viewModel.appointments.collectAsState()
    val doctors by viewModel.filteredDoctors.collectAsState()
    val hospitals by viewModel.filteredHospitals.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp)
    ) {
        // Welcome Card
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("dashboard_welcome_card")
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column {
                            Text(
                                text = if (lang == Language.NP) "नमस्ते, ${user?.fullName ?: "नागरिक"}!" else "Namaste, ${user?.fullName ?: "Citizen"}!",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                            Text(
                                text = if (lang == Language.NP) "राष्ट्रिय डिजिटल टेलिमेडिसिन पोर्टल नेपाल" else "National Digital Telemedicine Portal of Nepal",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                            )
                        }
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(NepalCrimson),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.LocalHospital,
                                contentDescription = "Medical Cross",
                                tint = Color.White
                            )
                        }
                    }
                }
            }
        }

        // Quick Stats Row
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    title = if (lang == Language.NP) "विशेषज्ञहरू" else "Specialists",
                    value = "${doctors.size}",
                    icon = Icons.Default.MedicalServices,
                    color = NepalRoyalBlue,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = if (lang == Language.NP) "अस्पतालहरू" else "Hospitals",
                    value = "${hospitals.size}",
                    icon = Icons.Default.Apartment,
                    color = NepalCrimson,
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = if (lang == Language.NP) "एम्बुलेन्स" else "Ambulance",
                    value = "102",
                    icon = Icons.Default.Emergency,
                    color = Color(0xFFDC2626),
                    modifier = Modifier.weight(1f),
                    onClick = {
                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:102"))
                        context.startActivity(intent)
                    }
                )
            }
        }

        // Quick Actions
        item {
            Text(
                text = if (lang == Language.NP) "द्रुत सेवाहरू" else "Quick Actions",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }

        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ActionTile(
                        title = if (lang == Language.NP) "परामर्श बुक गर्नुहोस्" else "Book Doctor",
                        subtitle = if (lang == Language.NP) "विशेषज्ञ डाक्टर खोज्नुहोस्" else "Find certified specialists",
                        icon = Icons.Default.CalendarMonth,
                        color = NepalCrimson,
                        modifier = Modifier
                            .weight(1f)
                            .testTag("action_book_doctor"),
                        onClick = { viewModel.setCurrentTab(AppTab.DOCTORS) }
                    )
                    ActionTile(
                        title = if (lang == Language.NP) "जिनोन एआई ट्राइएज" else "Xenon AI Triage",
                        subtitle = if (lang == Language.NP) "लक्षण जाँच तथा प्राथमिक उपचार" else "Clinical medical intelligence",
                        icon = Icons.Default.Psychology,
                        color = NepalRoyalBlue,
                        modifier = Modifier
                            .weight(1f)
                            .testTag("action_xenon_ai"),
                        onClick = { viewModel.setCurrentTab(AppTab.XENON_AI) }
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ActionTile(
                        title = if (lang == Language.NP) "अस्पताल सहायता" else "Hospitals & Chat",
                        subtitle = if (lang == Language.NP) "२४/७ सेवा र आईसीयू" else "ICU & 24/7 direct desk",
                        icon = Icons.Default.Chat,
                        color = Color(0xFF059669),
                        modifier = Modifier
                            .weight(1f)
                            .testTag("action_hospitals"),
                        onClick = { viewModel.setCurrentTab(AppTab.HOSPITALS) }
                    )
                    ActionTile(
                        title = if (lang == Language.NP) "आपतकालीन हटलाइन" else "Emergency Helplines",
                        subtitle = if (lang == Language.NP) "हेलिकप्टर र एम्बुलेन्स" else "Helicopter & Red Cross 102",
                        icon = Icons.Default.PhoneInTalk,
                        color = Color(0xFFDC2626),
                        modifier = Modifier
                            .weight(1f)
                            .testTag("action_emergency"),
                        onClick = { viewModel.setCurrentTab(AppTab.EMERGENCY) }
                    )
                }
            }
        }

        // Daily Nepal Health Tip Card
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.TipsAndUpdates,
                        contentDescription = "Health Tip",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(28.dp)
                    )
                    Column {
                        Text(
                            text = if (lang == Language.NP) "दैनिक स्वास्थ्य सुझाव" else "Daily Nepal Health Tip",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (lang == Language.NP)
                                "दैनिक कम्तीमा २-३ लिटर सफा उमालेको पानी पिउनुहोस्। धुलो र मौसमी भाइरलबाट बच्न बाहिर निस्कँदा सफा मास्क प्रयोग गर्नुहोस्।"
                            else
                                "Drink at least 2-3 liters of clean boiled water daily. Prevent seasonal viral illness and pollution exposure by wearing a mask in dusty areas.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.85f)
                        )
                    }
                }
            }
        }

        // Upcoming Consultations
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (lang == Language.NP) "आगामी परामर्शहरू" else "Upcoming Teleconsultations",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                TextButton(onClick = { viewModel.setCurrentTab(AppTab.RECORDS) }) {
                    Text(if (lang == Language.NP) "सबै हेर्नुहोस्" else "View All")
                }
            }
        }

        if (appointments.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Box(modifier = Modifier.padding(24.dp), contentAlignment = Alignment.Center) {
                        Text(
                            text = if (lang == Language.NP) "कुनै आगामी परामर्श छैन" else "No upcoming teleconsultations scheduled.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.Gray
                        )
                    }
                }
            }
        } else {
            items(appointments.take(2)) { appt ->
                AppointmentItemCard(
                    appointment = appt,
                    lang = lang,
                    onJoinVideo = { viewModel.openVideoRoom(appt) }
                )
            }
        }
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier.then(if (onClick != null) Modifier.testTag("stat_card_$value") else Modifier),
        onClick = { onClick?.invoke() }
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = color,
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = title,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                fontSize = 11.sp
            )
        }
    }
}

@Composable
fun ActionTile(
    title: String,
    subtitle: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier,
        onClick = onClick
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(color.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(imageVector = icon, contentDescription = title, tint = color)
            }
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                    maxLines = 1
                )
            }
        }
    }
}

@Composable
fun AppointmentItemCard(
    appointment: Appointment,
    lang: Language,
    onJoinVideo: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth().testTag("appointment_card_${appointment.id}")
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = appointment.doctorName,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
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
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "${appointment.specialty} • ${appointment.hospital}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "📅 ${appointment.date} at ${appointment.time}",
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "NPR ${appointment.feeNpr}",
                    style = MaterialTheme.typography.bodySmall,
                    color = NepalCrimson,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Button(
                onClick = onJoinVideo,
                colors = ButtonDefaults.buttonColors(containerColor = NepalRoyalBlue),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth().testTag("btn_join_video_${appointment.id}")
            ) {
                Icon(
                    imageVector = Icons.Default.Videocam,
                    contentDescription = "Video Call",
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(if (lang == Language.NP) "भिडियो कलमा जोडिनुहोस्" else "Join Encrypted Video Call")
            }
        }
    }
}
