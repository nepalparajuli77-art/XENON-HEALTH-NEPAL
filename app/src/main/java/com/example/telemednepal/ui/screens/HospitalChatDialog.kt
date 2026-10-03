package com.example.telemednepal.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.telemednepal.data.model.ChatMessage
import com.example.telemednepal.data.model.Hospital
import com.example.telemednepal.data.model.Language
import com.example.telemednepal.ui.theme.NepalRoyalBlue
import com.example.telemednepal.ui.viewmodel.TelemedViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HospitalChatDialog(
    hospital: Hospital,
    viewModel: TelemedViewModel
) {
    val lang by viewModel.language.collectAsState()
    var inputMessage by remember { mutableStateOf("") }
    val chatMessages = remember {
        mutableStateListOf(
            ChatMessage(
                sender = "hospital",
                text = "Namaste! Welcome to ${hospital.name} 24/7 Digital Helpdesk. How can we assist your visit or emergency triage inquiry?",
                time = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())
            )
        )
    }

    Dialog(
        onDismissRequest = { viewModel.closeHospitalChat() },
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .fillMaxHeight(0.85f)
                .testTag("hospital_chat_dialog")
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Header
                Surface(
                    color = NepalRoyalBlue,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = hospital.name,
                                color = Color.White,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Emergency Desk: ${hospital.emergency} • ${hospital.district}",
                                color = Color.White.copy(alpha = 0.8f),
                                fontSize = 11.sp
                            )
                        }
                        IconButton(onClick = { viewModel.closeHospitalChat() }) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = Color.White)
                        }
                    }
                }

                // Messages
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(chatMessages) { msg ->
                        val isUser = msg.sender == "user"
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalAlignment = if (isUser) Alignment.End else Alignment.Start
                        ) {
                            Surface(
                                color = if (isUser) NepalRoyalBlue else MaterialTheme.colorScheme.surfaceVariant,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.widthIn(max = 280.dp)
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Text(
                                        text = msg.text,
                                        color = if (isUser) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                    Text(
                                        text = msg.time,
                                        style = MaterialTheme.typography.bodySmall,
                                        fontSize = 10.sp,
                                        color = if (isUser) Color.White.copy(alpha = 0.7f) else Color.Gray,
                                        modifier = Modifier.align(Alignment.End)
                                    )
                                }
                            }
                        }
                    }
                }

                // Quick Query Buttons
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    SuggestionChip(
                        onClick = {
                            val timeNow = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())
                            chatMessages.add(ChatMessage(sender = "user", text = "Is an ICU bed currently available?", time = timeNow))
                            chatMessages.add(
                                ChatMessage(
                                    sender = "hospital",
                                    text = "Our triage desk confirms that ${if (hospital.icu) "ICU beds are available with ventilator support" else "ICU beds are currently at high capacity; emergency ward is open"}. Please call ${hospital.emergency} for immediate ambulance reservation.",
                                    time = timeNow
                                )
                            )
                        },
                        label = { Text("ICU Beds?", fontSize = 10.sp) }
                    )
                    SuggestionChip(
                        onClick = {
                            val timeNow = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())
                            chatMessages.add(ChatMessage(sender = "user", text = "What are the OPD ticket hours?", time = timeNow))
                            chatMessages.add(
                                ChatMessage(
                                    sender = "hospital",
                                    text = "General OPD tickets open from 08:00 AM to 02:00 PM (Sunday to Friday). Emergency services run 24 hours.",
                                    time = timeNow
                                )
                            )
                        },
                        label = { Text("OPD Hours", fontSize = 10.sp) }
                    )
                }

                // Input
                Surface(
                    color = MaterialTheme.colorScheme.surface,
                    tonalElevation = 2.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = inputMessage,
                            onValueChange = { inputMessage = it },
                            placeholder = { Text("Type message to helpdesk...", fontSize = 12.sp) },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(20.dp),
                            singleLine = true
                        )
                        IconButton(
                            onClick = {
                                if (inputMessage.isNotBlank()) {
                                    val timeNow = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())
                                    chatMessages.add(ChatMessage(sender = "user", text = inputMessage, time = timeNow))
                                    inputMessage = ""
                                    chatMessages.add(
                                        ChatMessage(
                                            sender = "hospital",
                                            text = "Thank you for contacting ${hospital.name} helpdesk. Our on-duty medical officer has received your message and will attend to you promptly.",
                                            time = timeNow
                                        )
                                    )
                                }
                            },
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(NepalRoyalBlue)
                        ) {
                            Icon(imageVector = Icons.AutoMirrored.Filled.Send, contentDescription = "Send", tint = Color.White)
                        }
                    }
                }
            }
        }
    }
}
