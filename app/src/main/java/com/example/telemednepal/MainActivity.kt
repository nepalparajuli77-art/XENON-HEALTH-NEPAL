package com.example.telemednepal

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.example.telemednepal.data.model.Language
import com.example.telemednepal.ui.screens.*
import com.example.telemednepal.ui.theme.NepalCrimson
import com.example.telemednepal.ui.theme.NepalRoyalBlue
import com.example.telemednepal.ui.theme.TelemedNepalTheme
import com.example.telemednepal.ui.viewmodel.AppTab
import com.example.telemednepal.ui.viewmodel.TelemedViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: TelemedViewModel by viewModels {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val app = application as TelemedApp
                return TelemedViewModel(app.repository) as T
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val isDark by viewModel.isDarkMode.collectAsState()
            TelemedNepalTheme(darkTheme = isDark) {
                TelemedMainApp(viewModel = viewModel)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TelemedMainApp(viewModel: TelemedViewModel) {
    val currentTab by viewModel.currentTab.collectAsState()
    val lang by viewModel.language.collectAsState()
    val user by viewModel.currentUser.collectAsState()
    val isDark by viewModel.isDarkMode.collectAsState()
    val toastMessage by viewModel.toastMessage.collectAsState()

    val bookingDoctor by viewModel.selectedDoctorForBooking.collectAsState()
    val chatHospital by viewModel.selectedHospitalForChat.collectAsState()
    val videoAppt by viewModel.activeVideoAppointment.collectAsState()
    val isIssueRxOpen by viewModel.isIssueRxDialogOpen.collectAsState()
    val isAuthOpen by viewModel.isAuthDialogOpen.collectAsState()

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(toastMessage) {
        toastMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearToast()
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        contentWindowInsets = WindowInsets.systemBars,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.ic_telemed_logo),
                            contentDescription = "Telemed Nepal Logo",
                            modifier = Modifier
                                .size(34.dp)
                                .clip(CircleShape)
                        )
                        Column {
                            Text(
                                text = "Telemed Nepal",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = if (lang == Language.NP) "डिजिटल स्वास्थ्य सेवा" else "Digital Health Portal",
                                style = MaterialTheme.typography.bodySmall,
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                    }
                },
                actions = {
                    // Language Switcher Toggle
                    OutlinedButton(
                        onClick = {
                            viewModel.setLanguage(if (lang == Language.EN) Language.NP else Language.EN)
                        },
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                        modifier = Modifier
                            .height(32.dp)
                            .testTag("btn_language_toggle"),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Text(
                            text = if (lang == Language.EN) "नेपाली" else "EN",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    // Dark Theme Toggle
                    IconButton(
                        onClick = { viewModel.toggleDarkMode() },
                        modifier = Modifier.testTag("btn_theme_toggle")
                    ) {
                        Icon(
                            imageVector = if (isDark) Icons.Default.LightMode else Icons.Default.DarkMode,
                            contentDescription = "Toggle theme"
                        )
                    }

                    // User Profile / Role Chip
                    Surface(
                        color = when (user?.role) {
                            "doctor" -> NepalRoyalBlue.copy(alpha = 0.15f)
                            "admin" -> Color(0xFF7C3AED).copy(alpha = 0.15f)
                            else -> NepalCrimson.copy(alpha = 0.15f)
                        },
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .padding(end = 8.dp)
                            .clickable { viewModel.openAuthDialog() }
                            .testTag("user_role_chip")
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.AccountCircle,
                                contentDescription = "Profile",
                                modifier = Modifier.size(16.dp),
                                tint = when (user?.role) {
                                    "doctor" -> NepalRoyalBlue
                                    "admin" -> Color(0xFF7C3AED)
                                    else -> NepalCrimson
                                }
                            )
                            Text(
                                text = user?.role?.uppercase() ?: "LOGIN",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = when (user?.role) {
                                    "doctor" -> NepalRoyalBlue
                                    "admin" -> Color(0xFF7C3AED)
                                    else -> NepalCrimson
                                }
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 6.dp
            ) {
                NavigationBarItem(
                    selected = currentTab == AppTab.DASHBOARD,
                    onClick = { viewModel.setCurrentTab(AppTab.DASHBOARD) },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Dashboard") },
                    label = { Text(if (lang == Language.NP) "गृहपृष्ठ" else "Home", fontSize = 10.sp) },
                    modifier = Modifier.testTag("nav_item_dashboard")
                )
                NavigationBarItem(
                    selected = currentTab == AppTab.DOCTORS,
                    onClick = { viewModel.setCurrentTab(AppTab.DOCTORS) },
                    icon = { Icon(Icons.Default.MedicalServices, contentDescription = "Doctors") },
                    label = { Text(if (lang == Language.NP) "डाक्टर" else "Doctors", fontSize = 10.sp) },
                    modifier = Modifier.testTag("nav_item_doctors")
                )
                NavigationBarItem(
                    selected = currentTab == AppTab.HOSPITALS,
                    onClick = { viewModel.setCurrentTab(AppTab.HOSPITALS) },
                    icon = { Icon(Icons.Default.Apartment, contentDescription = "Hospitals") },
                    label = { Text(if (lang == Language.NP) "अस्पताल" else "Hospitals", fontSize = 10.sp) },
                    modifier = Modifier.testTag("nav_item_hospitals")
                )
                NavigationBarItem(
                    selected = currentTab == AppTab.RECORDS,
                    onClick = { viewModel.setCurrentTab(AppTab.RECORDS) },
                    icon = { Icon(Icons.Default.ReceiptLong, contentDescription = "Records") },
                    label = { Text(if (lang == Language.NP) "रेकर्ड" else "Records", fontSize = 10.sp) },
                    modifier = Modifier.testTag("nav_item_records")
                )
                NavigationBarItem(
                    selected = currentTab == AppTab.EMERGENCY,
                    onClick = { viewModel.setCurrentTab(AppTab.EMERGENCY) },
                    icon = {
                        Icon(
                            Icons.Default.Emergency,
                            contentDescription = "Emergency",
                            tint = if (currentTab == AppTab.EMERGENCY) NepalCrimson else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    },
                    label = { Text("102", fontSize = 10.sp, color = NepalCrimson, fontWeight = FontWeight.Bold) },
                    modifier = Modifier.testTag("nav_item_emergency")
                )
                NavigationBarItem(
                    selected = currentTab == AppTab.XENON_AI,
                    onClick = { viewModel.setCurrentTab(AppTab.XENON_AI) },
                    icon = { Icon(Icons.Default.Psychology, contentDescription = "Xenon AI") },
                    label = { Text("Xenon AI", fontSize = 10.sp) },
                    modifier = Modifier.testTag("nav_item_xenon_ai")
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (currentTab) {
                AppTab.DASHBOARD -> DashboardScreen(viewModel = viewModel)
                AppTab.DOCTORS -> DoctorsScreen(viewModel = viewModel)
                AppTab.HOSPITALS -> HospitalsScreen(viewModel = viewModel)
                AppTab.RECORDS -> PatientRecordsScreen(viewModel = viewModel)
                AppTab.EMERGENCY -> EmergencyScreen(viewModel = viewModel)
                AppTab.XENON_AI -> XenonAiScreen(viewModel = viewModel)
            }
        }

        // Active Dialog Overlays
        bookingDoctor?.let { doc ->
            BookAppointmentDialog(doctor = doc, viewModel = viewModel)
        }

        chatHospital?.let { hosp ->
            HospitalChatDialog(hospital = hosp, viewModel = viewModel)
        }

        videoAppt?.let { appt ->
            VideoConsultationDialog(appointment = appt, viewModel = viewModel)
        }

        if (isIssueRxOpen) {
            IssuePrescriptionDialog(viewModel = viewModel)
        }

        if (isAuthOpen) {
            AuthDialog(viewModel = viewModel)
        }
    }
}
