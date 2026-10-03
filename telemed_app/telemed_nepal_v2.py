#!/usr/bin/env python3
"""
Telemed Nepal v2.0 — Glassmorphism Edition
A modern telemedicine portal for Nepal with:
- Liquid Glass (Glassmorphism) UI theme (Light & Dark)
- Complete English / Nepali (नेपाली) language toggle
- 16+ Specialists across top Nepalese hospitals
- Re-architected Unified "Patient Records" view (Appointments + Prescriptions + Vitals)
- Real-time Hospital Chat with simulated response engine
- Emergency Hotlines (102, 100, 103, 1115, 1166)
"""

import sys
import os
import json
import uuid
import hashlib
import random
from datetime import datetime, date

from PyQt6 import QtCore, QtGui, QtWidgets
from PyQt6.QtCore import Qt, QTimer, QDate, QTime
from PyQt6.QtGui import QFont, QColor, QTextCursor, QIcon
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QPushButton, QLineEdit, QStackedWidget, QTabWidget,
    QListWidget, QListWidgetItem, QTableWidget, QTableWidgetItem,
    QDialog, QFormLayout, QComboBox, QTextEdit, QDateEdit,
    QMessageBox, QFrame, QScrollArea, QGridLayout, QSplitter,
    QStatusBar, QHeaderView, QAbstractItemView, QCheckBox,
    QSizePolicy, QGroupBox, QSpinBox, QTextBrowser
)

APP_DATA_FILE = os.path.join(os.path.dirname(__file__), "telemed_nepal_data.json")
CURRENT_LANG = "en"  # "en" or "np"

# ═══════════════════════════════════════════════════════════
#  TRANSLATION DICTIONARY (English <-> Nepali)
# ═══════════════════════════════════════════════════════════
TRANSLATIONS = {
    # App General
    "app_title": {"en": "Telemed Nepal — Smart Healthcare Portal", "np": "टेलीमेड नेपाल — स्मार्ट स्वास्थ्य सेवा पोर्टल"},
    "tagline": {"en": "Bridging Healthcare Across Nepal", "np": "नेपालभर स्वास्थ्य सेवाको पहुँच"},
    "language": {"en": "English", "np": "नेपाली"},
    "toggle_lang": {"en": "🇳🇵 नेपाली", "np": "🌐 English"},
    "toggle_theme_dark": {"en": "🌙 Dark Mode", "np": "🌙 डार्क मोड"},
    "toggle_theme_light": {"en": "☀️ Light Mode", "np": "☀️ लाइट मोड"},
    "logout": {"en": "Logout", "np": "लगआउट"},
    "welcome": {"en": "Welcome", "np": "स्वागत छ"},
    "role": {"en": "Role", "np": "भूमिका"},
    
    # Navigation Tabs
    "tab_dashboard": {"en": "📊 Dashboard", "np": "📊 डैशबोर्ड"},
    "tab_doctors": {"en": "👨‍⚕️ Doctors", "np": "👨‍⚕️ डाक्टरहरू"},
    "tab_hospitals": {"en": "🏥 Hospitals", "np": "🏥 अस्पतालहरू"},
    "tab_records": {"en": "📑 Patient Records", "np": "📑 बिरामी अभिलेख"},
    "tab_emergency": {"en": "🚨 Emergency", "np": "🚨 आपतकालीन सेवा"},
    "tab_my_account": {"en": "👤 My Profile", "np": "👤 मेरो प्रोफाइल"},

    # Dashboard Stat Cards
    "stat_doctors": {"en": "Active Doctors", "np": "सक्रिय डाक्टरहरू"},
    "stat_hospitals": {"en": "Partner Hospitals", "np": "आबद्ध अस्पतालहरू"},
    "stat_appointments": {"en": "Total Appointments", "np": "कुल अपोइन्टमेन्ट"},
    "stat_emergency": {"en": "Ambulance Hotline", "np": "एम्बुलेन्स हटलाइन"},
    "quick_actions": {"en": "Quick Actions", "np": "द्रुत कार्यहरू"},
    "book_doctor": {"en": "📅 Book a Doctor", "np": "📅 डाक्टर बुक गर्नुहोस्"},
    "chat_hospital": {"en": "💬 Hospital Helpdesk", "np": "💬 अस्पताल सहायता"},
    "view_my_records": {"en": "📂 View My Records", "np": "📂 मेरो रेकर्ड हेर्नुहोस्"},
    "call_ambulance": {"en": "🚑 Call Ambulance (102)", "np": "🚑 एम्बुलेन्स बोलाउनुहोस् (१०२)"},
    "upcoming_consultations": {"en": "Upcoming Teleconsultations", "np": "आगामी परामर्शहरू"},
    "health_tip_title": {"en": "💡 Daily Health Tip (दैनिक स्वास्थ्य सुझाव)", "np": "💡 दैनिक स्वास्थ्य सुझाव"},
    "health_tip_text": {
        "en": "Drink at least 2-3 liters of clean boiled water daily. Take regular breaks if working on screens to protect eye health.",
        "np": "दैनिक कम्तीमा २-३ लिटर सफा उमालेको पानी पिउनुहोस्। आँखाको सुरक्षाका लागि स्क्रिनमा काम गर्दा नियमित विश्राम लिनुहोस्।"
    },

    # Doctors View
    "search_doctors_placeholder": {"en": "Search by doctor name, specialty, or hospital...", "np": "डाक्टरको नाम, विशेषज्ञता वा अस्पताल खोज्नुहोस्..."},
    "all_specialties": {"en": "All Specialties", "np": "सबै विशेषज्ञता"},
    "all_hospitals": {"en": "All Hospitals", "np": "सबै अस्पतालहरू"},
    "filter_available": {"en": "Available Today Only", "np": "आज उपलब्ध मात्र"},
    "btn_book_appointment": {"en": "Book Consultation", "np": "परामर्श लिनुहोस्"},
    "experience": {"en": "Experience", "np": "अनुभव"},
    "fee": {"en": "Fee", "np": "परामर्श शुल्क"},
    "nmc_no": {"en": "NMC No.", "np": "एनएमसी नं."},
    "languages_spoken": {"en": "Languages", "np": "भाषाहरू"},
    "status_available": {"en": "Available", "np": "उपलब्ध"},
    "status_busy": {"en": "On Duty / Busy", "np": "व्यस्त"},

    # Hospitals View
    "search_hospitals_placeholder": {"en": "Search hospital name, location, or specialty...", "np": "अस्पतालको नाम, स्थान वा विभाग खोज्नुहोस्..."},
    "btn_open_chat": {"en": "💬 Live Chat", "np": "💬 प्रत्यक्ष च्याट"},
    "btn_view_doctors": {"en": "View Doctors", "np": "डाक्टरहरू हेर्नुहोस्"},
    "icu_available": {"en": "ICU Available", "np": "आईसीयू उपलब्ध"},
    "open_247": {"en": "24/7 Open", "np": "२४ घण्टा खुला"},
    "emergency_line": {"en": "Emergency Line", "np": "आपतकालीन फोन"},
    "total_beds": {"en": "Total Beds", "np": "कुल बेड संख्या"},

    # Patient Records View
    "records_title": {"en": "Patient Medical History & Prescriptions", "np": "बिरामीको चिकित्सा इतिहास तथा प्रेस्क्रिप्सन"},
    "sub_appointments": {"en": "Appointments & Consultations", "np": "परामर्श तथा भेटघाटहरू"},
    "sub_prescriptions": {"en": "Digital Prescriptions", "np": "डिजिटल प्रेस्क्रिप्सनहरू"},
    "btn_new_prescription": {"en": "+ Issue Prescription", "np": "+ नयाँ प्रेस्क्रिप्सन जारी"},
    "date": {"en": "Date", "np": "मिति"},
    "time": {"en": "Time", "np": "समय"},
    "doctor": {"en": "Doctor", "np": "डाक्टर"},
    "patient": {"en": "Patient", "np": "बिरामी"},
    "specialty": {"en": "Specialty", "np": "विभाग"},
    "type": {"en": "Type", "np": "प्रकार"},
    "status": {"en": "Status", "np": "स्थिति"},
    "actions": {"en": "Actions", "np": "कार्यहरू"},
    "symptoms": {"en": "Reported Symptoms", "np": "लक्षणहरू"},
    "diagnosis": {"en": "Diagnosis", "np": "रोग निदान"},
    "vitals": {"en": "Patient Vitals", "np": "शारीरिक जाँच (Vitals)"},
    "medications": {"en": "Prescribed Medicines", "np": "औषधिहरूको विवरण"},
    "dosage": {"en": "Dosage", "np": "मात्रा"},
    "frequency": {"en": "Frequency", "np": "पटक"},
    "instructions": {"en": "Instructions", "np": "निर्देशन"},
    "advice": {"en": "Doctor Advice & Lifestyle", "np": "डाक्टरको सल्लाह"},
    "follow_up": {"en": "Follow-Up Date", "np": "पुन: जाँच मिति"},
    "btn_join_video": {"en": "🎥 Join Video Call", "np": "🎥 भिडियो कल जोड्नुहोस्"},
    "btn_print_rx": {"en": "🖨️ Print Prescription", "np": "🖨️ प्रेस्क्रिप्सन छाप्नुहोस्"},

    # Emergency View
    "emergency_title": {"en": "National Emergency Medical Services (Nepal)", "np": "राष्ट्रिय आपतकालीन स्वास्थ्य सेवाहरू (नेपाल)"},
    "emergency_subtitle": {"en": "24/7 Free Helpline Contacts across 77 Districts", "np": "७७ वटै जिल्लामा २४ घण्टा निःशुल्क हेल्पलाइन सम्पर्कहरू"},
    "btn_copy_number": {"en": "Copy Helpline", "np": "नम्बर कपी"},

    # Dialogs & Forms
    "book_dialog_title": {"en": "Schedule Teleconsultation", "np": "परामर्श तालिका बनाउनुहोस्"},
    "select_doctor": {"en": "Select Doctor", "np": "डाक्टर छान्नुहोस्"},
    "consultation_date": {"en": "Consultation Date", "np": "परामर्श मिति"},
    "consultation_time": {"en": "Time Slot", "np": "समय"},
    "consultation_mode": {"en": "Consultation Mode", "np": "परामर्शको माध्यम"},
    "symptoms_notes": {"en": "Describe Symptoms / Chief Complaints", "np": "लक्षण तथा समस्याको विवरण"},
    "btn_confirm_booking": {"en": "Confirm & Book", "np": "बुकिङ पुष्टि गर्नुहोस्"},
    "btn_cancel": {"en": "Cancel", "np": "रद्द गर्नुहोस्"},
    "booking_success": {"en": "Appointment successfully booked!", "np": "अपोइन्टमेन्ट सफलतापूर्वक बुक गरियो!"},

    # Auth
    "login_title": {"en": "Telemed Nepal — Sign In", "np": "टेलीमेड नेपाल — लगइन"},
    "username": {"en": "Username", "np": "प्रयोगकर्ता नाम"},
    "password": {"en": "Password", "np": "पासवर्ड"},
    "btn_login": {"en": "Sign In", "np": "लगइन गर्नुहोस्"},
    "btn_register": {"en": "Create New Patient Account", "np": "नयाँ खाता खोल्नुहोस्"},
    "demo_accounts": {"en": "Demo Accounts: admin / patient_nepal / dr_ramesh (password: any)", "np": "डेमो खाताहरू: admin / patient_nepal / dr_ramesh (पासवर्ड: जुनसुकै)"},
}

def tr(key: str) -> str:
    """Translates a key based on current active language."""
    entry = TRANSLATIONS.get(key)
    if entry:
        return entry.get(CURRENT_LANG, entry.get("en", key))
    return key


# ═══════════════════════════════════════════════════════════
#  GLASSMORPHISM STYLESHEETS (Liquid Glass UI)
# ═══════════════════════════════════════════════════════════
LIGHT_GLASS_THEME = """
QMainWindow {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
        stop:0 #E0F2FE, stop:0.4 #F0F9FF, stop:0.8 #EDE9FE, stop:1 #F3E8FF);
    font-family: 'Segoe UI', 'Noto Sans Devanagari', -apple-system, sans-serif;
    font-size: 13px;
    color: #0F172A;
}

QWidget {
    font-family: 'Segoe UI', 'Noto Sans Devanagari', sans-serif;
    color: #0F172A;
}

/* Tab Bar Glass */
QTabWidget::pane {
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.55);
    margin-top: 6px;
}

QTabBar::tab {
    background: rgba(255, 255, 255, 0.4);
    color: #475569;
    padding: 10px 20px;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    margin-right: 4px;
    font-weight: 600;
    font-size: 12px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-bottom: none;
}

QTabBar::tab:selected {
    background: rgba(255, 255, 255, 0.85);
    color: #0284C7;
    border-bottom: 3px solid #0284C7;
    font-weight: 700;
}

QTabBar::tab:hover {
    background: rgba(224, 242, 254, 0.75);
    color: #0369A1;
}

/* Glass Frame Cards */
QFrame#glassCard, QFrame.glassCard {
    background: rgba(255, 255, 255, 0.68);
    border: 1px solid rgba(255, 255, 255, 0.85);
    border-radius: 14px;
}

QFrame#navBar {
    background: rgba(255, 255, 255, 0.75);
    border-bottom: 1px solid rgba(255, 255, 255, 0.9);
    border-radius: 0px;
}

/* Buttons */
QPushButton {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #0284C7, stop:1 #0369A1);
    color: #FFFFFF;
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 10px;
    padding: 9px 18px;
    font-weight: 600;
    font-size: 13px;
}

QPushButton:hover {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #0369A1, stop:1 #075985);
}

QPushButton:pressed {
    background: #0C4A6E;
}

QPushButton#glassBtnSecondary {
    background: rgba(255, 255, 255, 0.7);
    color: #334155;
    border: 1px solid rgba(203, 213, 225, 0.8);
}

QPushButton#glassBtnSecondary:hover {
    background: rgba(241, 245, 249, 0.9);
    color: #0F172A;
}

QPushButton#glassBtnSuccess {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #10B981, stop:1 #059669);
    color: white;
}

QPushButton#glassBtnSuccess:hover {
    background: #047857;
}

QPushButton#glassBtnDanger {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #EF4444, stop:1 #DC2626);
    color: white;
}

QPushButton#glassBtnDanger:hover {
    background: #B91C1C;
}

QPushButton#glassBtnPurple {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #8B5CF6, stop:1 #7C3AED);
    color: white;
}

QPushButton#glassBtnPurple:hover {
    background: #6D28D9;
}

/* Inputs & Form Controls */
QLineEdit, QTextEdit, QComboBox, QDateEdit, QSpinBox {
    background: rgba(255, 255, 255, 0.8);
    border: 1.5px solid rgba(203, 213, 225, 0.9);
    border-radius: 10px;
    padding: 8px 12px;
    color: #0F172A;
    font-size: 13px;
}

QLineEdit:focus, QTextEdit:focus, QComboBox:focus, QDateEdit:focus {
    border: 2px solid #0284C7;
    background: #FFFFFF;
}

/* Tables & Lists */
QTableWidget, QListWidget {
    background: rgba(255, 255, 255, 0.75);
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 12px;
    gridline-color: rgba(241, 245, 249, 0.9);
}

QTableWidget::item {
    padding: 10px;
    border-bottom: 1px solid rgba(241, 245, 249, 0.9);
}

QTableWidget::item:selected, QListWidget::item:selected {
    background: rgba(224, 242, 254, 0.85);
    color: #0369A1;
    font-weight: 600;
}

QHeaderView::section {
    background: rgba(241, 245, 249, 0.85);
    color: #334155;
    font-weight: 700;
    padding: 10px;
    border: none;
    border-bottom: 2px solid rgba(203, 213, 225, 0.8);
}

/* ScrollBars */
QScrollBar:vertical {
    background: rgba(241, 245, 249, 0.5);
    width: 8px;
    border-radius: 4px;
}
QScrollBar::handle:vertical {
    background: rgba(148, 163, 184, 0.6);
    border-radius: 4px;
}

/* Status Bar */
QStatusBar {
    background: rgba(255, 255, 255, 0.8);
    color: #475569;
    border-top: 1px solid rgba(226, 232, 240, 0.8);
    font-weight: 600;
    padding: 4px 12px;
}
"""

DARK_GLASS_THEME = """
QMainWindow {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
        stop:0 #0B0F17, stop:0.4 #111827, stop:0.8 #1E1B4B, stop:1 #0F172A);
    font-family: 'Segoe UI', 'Noto Sans Devanagari', -apple-system, sans-serif;
    font-size: 13px;
    color: #F8FAFC;
}

QWidget {
    font-family: 'Segoe UI', 'Noto Sans Devanagari', sans-serif;
    color: #F8FAFC;
}

QTabWidget::pane {
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    background: rgba(17, 24, 39, 0.65);
    margin-top: 6px;
}

QTabBar::tab {
    background: rgba(30, 41, 59, 0.5);
    color: #94A3B8;
    padding: 10px 20px;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    margin-right: 4px;
    font-weight: 600;
    font-size: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-bottom: none;
}

QTabBar::tab:selected {
    background: rgba(30, 41, 59, 0.9);
    color: #38BDF8;
    border-bottom: 3px solid #38BDF8;
    font-weight: 700;
}

QTabBar::tab:hover {
    background: rgba(51, 65, 85, 0.7);
    color: #7DD3FC;
}

QFrame#glassCard, QFrame.glassCard {
    background: rgba(30, 41, 59, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
}

QFrame#navBar {
    background: rgba(17, 24, 39, 0.85);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0px;
}

QPushButton {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #0284C7, stop:1 #0369A1);
    color: #FFFFFF;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    padding: 9px 18px;
    font-weight: 600;
    font-size: 13px;
}

QPushButton:hover {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #0369A1, stop:1 #0284C7);
}

QPushButton#glassBtnSecondary {
    background: rgba(51, 65, 85, 0.7);
    color: #E2E8F0;
    border: 1px solid rgba(255, 255, 255, 0.12);
}

QPushButton#glassBtnSecondary:hover {
    background: rgba(71, 85, 105, 0.9);
}

QPushButton#glassBtnSuccess {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #10B981, stop:1 #059669);
    color: white;
}

QPushButton#glassBtnDanger {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #EF4444, stop:1 #DC2626);
    color: white;
}

QPushButton#glassBtnPurple {
    background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #8B5CF6, stop:1 #7C3AED);
    color: white;
}

QLineEdit, QTextEdit, QComboBox, QDateEdit, QSpinBox {
    background: rgba(30, 41, 59, 0.8);
    border: 1.5px solid rgba(71, 85, 105, 0.8);
    border-radius: 10px;
    padding: 8px 12px;
    color: #F8FAFC;
    font-size: 13px;
}

QLineEdit:focus, QTextEdit:focus, QComboBox:focus, QDateEdit:focus {
    border: 2px solid #38BDF8;
    background: rgba(15, 23, 42, 0.95);
}

QTableWidget, QListWidget {
    background: rgba(17, 24, 39, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    gridline-color: rgba(51, 65, 85, 0.6);
}

QTableWidget::item {
    padding: 10px;
    border-bottom: 1px solid rgba(51, 65, 85, 0.6);
}

QTableWidget::item:selected, QListWidget::item:selected {
    background: rgba(3, 105, 161, 0.6);
    color: #BAE6FD;
}

QHeaderView::section {
    background: rgba(30, 41, 59, 0.9);
    color: #94A3B8;
    font-weight: 700;
    padding: 10px;
    border: none;
    border-bottom: 2px solid rgba(71, 85, 105, 0.8);
}

QScrollBar:vertical {
    background: rgba(15, 23, 42, 0.5);
    width: 8px;
    border-radius: 4px;
}
QScrollBar::handle:vertical {
    background: rgba(71, 85, 105, 0.8);
    border-radius: 4px;
}

QStatusBar {
    background: rgba(17, 24, 39, 0.9);
    color: #94A3B8;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}
"""

# ═══════════════════════════════════════════════════════════
#  SECURITY & AUTHENTICATION
# ═══════════════════════════════════════════════════════════
def hash_password(pw: str) -> str:
    try:
        import bcrypt
        return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
    except ImportError:
        salt = "telemed_nepal_v2_salt"
        return hashlib.sha256((salt + pw).encode()).hexdigest()

def check_password(pw: str, hashed: str) -> bool:
    try:
        import bcrypt
        if hashed.startswith("$2b$") or hashed.startswith("$2a$"):
            return bcrypt.checkpw(pw.encode(), hashed.encode())
    except ImportError:
        pass
    salt = "telemed_nepal_v2_salt"
    return (hashlib.sha256((salt + pw).encode()).hexdigest() == hashed) or (hashed == "telemed_nepal_v2_salt")

# ═══════════════════════════════════════════════════════════
#  DATA PERSISTENCE & BOOTSTRAP
# ═══════════════════════════════════════════════════════════
def load_app_data() -> dict:
    if os.path.exists(APP_DATA_FILE):
        try:
            with open(APP_DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print("Error loading data file:", e)
    return bootstrap_data()

def save_app_data(data: dict) -> bool:
    try:
        with open(APP_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print("Save error:", e)
        return False

def bootstrap_data() -> dict:
    """Provides complete initial database if json file is missing."""
    return {
        "users": [
            {
                "id": "usr_001", "username": "admin",
                "password_hash": "telemed_nepal_v2_salt",
                "role": "admin", "full_name": "System Administrator",
                "phone": "+977-9801234567", "email": "admin@telemednepal.org.np"
            },
            {
                "id": "usr_004", "username": "patient_nepal",
                "password_hash": "telemed_nepal_v2_salt",
                "role": "patient", "full_name": "Nepal Parajuli",
                "phone": "+977-9818765432", "email": "nepal.parajuli.77@gmail.com",
                "blood_group": "O+", "age": 29, "gender": "Male",
                "address": "Baneshwor, Kathmandu", "allergies": ["Penicillin"]
            }
        ],
        "doctors": [
            {
                "id": "doc_001", "name": "Dr. Ramesh Sharma", "nmc_number": "NMC-4512",
                "specialty": "Cardiology", "specialty_np": "मुटुरोग (Cardiology)",
                "hospital": "Norvic International Hospital", "hospital_id": "hosp_001",
                "degrees": "MBBS, MD (Cardiology), FSCAI", "experience_years": 14,
                "fee_npr": 1200, "available": True, "rating": 4.9, "languages": ["Nepali", "English", "Hindi"]
            },
            {
                "id": "doc_002", "name": "Dr. Sita Adhikari", "nmc_number": "NMC-6789",
                "specialty": "Gynecology & Obstetrics", "specialty_np": "स्त्री तथा प्रसूतिरोग (Gynecology)",
                "hospital": "Patan Hospital", "hospital_id": "hosp_006",
                "degrees": "MBBS, MS (Obs/Gynae)", "experience_years": 11,
                "fee_npr": 900, "available": True, "rating": 4.8, "languages": ["Nepali", "English", "Newari"]
            },
            {
                "id": "doc_003", "name": "Dr. Bibek Thapa", "nmc_number": "NMC-8821",
                "specialty": "Orthopedics & Spine Surgery", "specialty_np": "हाडजोर्नी तथा नशा (Orthopedics)",
                "hospital": "Om Hospital & Research Centre", "hospital_id": "hosp_004",
                "degrees": "MBBS, MS (Ortho)", "experience_years": 16,
                "fee_npr": 1100, "available": True, "rating": 4.7, "languages": ["Nepali", "English"]
            },
            {
                "id": "doc_004", "name": "Dr. Priya Karki", "nmc_number": "NMC-9943",
                "specialty": "Pediatrics & Child Health", "specialty_np": "बालरोग (Pediatrics)",
                "hospital": "Kanti Children's Hospital", "hospital_id": "hosp_014",
                "degrees": "MBBS, MD (Pediatrics)", "experience_years": 9,
                "fee_npr": 750, "available": True, "rating": 4.9, "languages": ["Nepali", "English"]
            }
        ],
        "hospitals": [
            {
                "id": "hosp_001", "name": "Norvic International Hospital", "name_np": "नर्भिक इन्टरनेशनल हस्पिटल",
                "address": "Thapathali, Kathmandu", "district": "Kathmandu",
                "phone": "+977-01-4258554", "emergency": "+977-01-4258555",
                "email": "info@norvichospital.com", "type": "Private", "beds": 150, "icu": True,
                "specialties": ["Cardiology", "Neurology", "Orthopedics"], "open_247": True, "rating": 4.7
            },
            {
                "id": "hosp_006", "name": "Patan Hospital", "name_np": "पाटन अस्पताल",
                "address": "Lagankhel, Lalitpur", "district": "Lalitpur",
                "phone": "+977-01-5522266", "emergency": "+977-01-5522278",
                "email": "info@patanhospital.org.np", "type": "Non-Profit", "beds": 350, "icu": True,
                "specialties": ["General Medicine", "Surgery", "Pediatrics"], "open_247": True, "rating": 4.4
            }
        ],
        "appointments": [],
        "prescriptions": [],
        "chats": {},
        "emergency_contacts": [
            {"name": "National Ambulance Hotline", "name_np": "राष्ट्रिय एम्बुलेन्स सेवा", "number": "102"},
            {"name": "Nepal Police", "name_np": "नेपाल प्रहरी", "number": "100"},
            {"name": "Traffic Police", "name_np": "ट्राफिक प्रहरी", "number": "103"}
        ]
    }


# ═══════════════════════════════════════════════════════════
#  LIQUID GLASS STAT CARD WIDGET
# ═══════════════════════════════════════════════════════════
class LiquidGlassStatCard(QFrame):
    def __init__(self, title_key: str, value: str, icon: str, color_hex: str = "#0284C7", parent=None):
        super().__init__(parent)
        self.title_key = title_key
        self.setFixedHeight(115)
        self.setObjectName("glassCard")
        
        self.setStyleSheet(f"""
            QFrame#glassCard {{
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                    stop:0 rgba(255, 255, 255, 0.8), stop:1 rgba(255, 255, 255, 0.5));
                border: 1px solid rgba(255, 255, 255, 0.9);
                border-radius: 16px;
            }}
        """)
        
        layout = QHBoxLayout(self)
        layout.setContentsMargins(18, 14, 18, 14)
        
        # Icon Box
        icon_box = QFrame()
        icon_box.setFixedSize(54, 54)
        icon_box.setStyleSheet(f"""
            QFrame {{
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                    stop:0 {color_hex}, stop:1 {color_hex}CC);
                border-radius: 14px;
                border: 1px solid rgba(255, 255, 255, 0.4);
            }}
        """)
        ib_layout = QVBoxLayout(icon_box)
        ib_layout.setContentsMargins(0, 0, 0, 0)
        icon_lbl = QLabel(icon)
        icon_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        f = QFont(); f.setPointSize(22)
        icon_lbl.setFont(f)
        icon_lbl.setStyleSheet("background: transparent; color: white;")
        ib_layout.addWidget(icon_lbl)
        
        # Text Info
        text_layout = QVBoxLayout()
        text_layout.setSpacing(2)
        
        self.val_lbl = QLabel(str(value))
        vf = QFont(); vf.setPointSize(22); vf.setBold(True)
        self.val_lbl.setFont(vf)
        self.val_lbl.setStyleSheet("color: #0F172A; background: transparent;")
        
        self.title_lbl = QLabel(tr(self.title_key))
        tf = QFont(); tf.setPointSize(10); tf.setBold(True)
        self.title_lbl.setFont(tf)
        self.title_lbl.setStyleSheet("color: #64748B; background: transparent;")
        
        text_layout.addWidget(self.val_lbl)
        text_layout.addWidget(self.title_lbl)
        
        layout.addWidget(icon_box)
        layout.addSpacing(14)
        layout.addLayout(text_layout)
        layout.addStretch()

    def update_language(self):
        self.title_lbl.setText(tr(self.title_key))

    def update_value(self, val):
        self.val_lbl.setText(str(val))


# ═══════════════════════════════════════════════════════════
#  HOSPITAL LIVE CHAT DIALOG
# ═══════════════════════════════════════════════════════════
class HospitalChatDialog(QDialog):
    def __init__(self, hospital: dict, current_user: dict, db_ref: dict, parent=None):
        super().__init__(parent)
        self.hospital = hospital
        self.user = current_user
        self.db = db_ref
        
        chat_key = f"{self.user['username']}:{hospital['id']}"
        if "chats" not in self.db:
            self.db["chats"] = {}
        if chat_key not in self.db["chats"]:
            self.db["chats"][chat_key] = [
                {
                    "sender": "hospital",
                    "text": f"Namaste! Thank you for contacting {hospital['name']}. How can our clinical team assist you today?",
                    "time": datetime.now().strftime("%I:%M %p")
                }
            ]
        self.chat_history = self.db["chats"][chat_key]
        
        self.setWindowTitle(f"💬 Live Consultation Helpdesk — {hospital['name']}")
        self.setMinimumSize(560, 600)
        self.setModal(False)
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)
        
        # Header
        header = QFrame()
        header.setFixedHeight(72)
        header.setStyleSheet("""
            QFrame {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0,
                    stop:0 #6B21A8, stop:0.5 #7C3AED, stop:1 #9333EA);
                border-radius: 0px;
            }
        """)
        h_layout = QHBoxLayout(header)
        h_layout.setContentsMargins(20, 0, 20, 0)
        
        h_icon = QLabel("🏥")
        hif = QFont(); hif.setPointSize(24); h_icon.setFont(hif)
        h_icon.setStyleSheet("background: transparent;")
        
        h_info = QVBoxLayout()
        h_name = QLabel(hospital['name'])
        hnf = QFont(); hnf.setPointSize(12); hnf.setBold(True); h_name.setFont(hnf)
        h_name.setStyleSheet("color: white; background: transparent;")
        
        h_sub = QLabel(f"📞 {hospital['phone']}  •  🚨 Emergency: {hospital['emergency']}")
        h_sub.setStyleSheet("color: rgba(255,255,255,0.85); font-size: 11px; background: transparent;")
        h_info.addWidget(h_name)
        h_info.addWidget(h_sub)
        
        online_badge = QLabel("🟢 24/7 Desk Active")
        online_badge.setStyleSheet("color: #86EFAC; font-weight: 700; font-size: 11px; background: transparent;")
        
        h_layout.addWidget(h_icon)
        h_layout.addSpacing(10)
        h_layout.addLayout(h_info)
        h_layout.addStretch()
        h_layout.addWidget(online_badge)
        layout.addWidget(header)
        
        # Chat Browser
        self.chat_display = QTextBrowser()
        self.chat_display.setStyleSheet("""
            QTextBrowser {
                background: rgba(248, 250, 252, 0.95);
                border: none;
                padding: 16px;
                font-size: 13px;
            }
        """)
        layout.addWidget(self.chat_display, 1)
        
        # Input Frame
        in_frame = QFrame()
        in_frame.setStyleSheet("QFrame { background: #FFFFFF; border-top: 1px solid #E2E8F0; }")
        in_layout = QHBoxLayout(in_frame)
        in_layout.setContentsMargins(14, 10, 14, 10)
        
        self.input_field = QLineEdit()
        self.input_field.setPlaceholderText(tr("search_doctors_placeholder"))
        self.input_field.setStyleSheet("""
            QLineEdit {
                background: #F1F5F9;
                border: 1px solid #CBD5E1;
                border-radius: 22px;
                padding: 10px 18px;
                font-size: 13px;
            }
            QLineEdit:focus { border: 2px solid #7C3AED; background: #FFFFFF; }
        """)
        self.input_field.returnPressed.connect(self.send_msg)
        
        send_btn = QPushButton("Send ➤")
        send_btn.setObjectName("glassBtnPurple")
        send_btn.setFixedWidth(95)
        send_btn.setStyleSheet("""
            QPushButton {
                background: #7C3AED; color: white; border-radius: 20px;
                padding: 10px 16px; font-weight: 700;
            }
            QPushButton:hover { background: #6D28D9; }
        """)
        send_btn.clicked.connect(self.send_msg)
        
        in_layout.addWidget(self.input_field)
        in_layout.addWidget(send_btn)
        layout.addWidget(in_frame)
        
        self.render_messages()

    def render_messages(self):
        self.chat_display.clear()
        for msg in self.chat_history:
            t = msg.get("time", "")
            txt = msg.get("text", "")
            if msg["sender"] == "user":
                html = f"""
                <div style="text-align:right; margin: 8px 0;">
                    <div style="display:inline-block; background:#7C3AED; color:#FFFFFF;
                        border-radius:18px 18px 4px 18px; padding:10px 16px;
                        max-width:75%; font-size:13px; text-align:left; line-height:1.4;">
                        {txt}
                    </div>
                    <div style="color:#94A3B8; font-size:10px; margin-top:2px;">{t}</div>
                </div>
                """
            else:
                html = f"""
                <div style="text-align:left; margin: 8px 0;">
                    <div style="display:inline-block; background:#E2E8F0; color:#0F172A;
                        border-radius:18px 18px 18px 4px; padding:10px 16px;
                        max-width:75%; font-size:13px; line-height:1.4;">
                        {txt}
                    </div>
                    <div style="color:#94A3B8; font-size:10px; margin-top:2px;">{t}</div>
                </div>
                """
            self.chat_display.append(html)
        
        cursor = self.chat_display.textCursor()
        cursor.movePosition(QTextCursor.MoveOperation.End)
        self.chat_display.setTextCursor(cursor)

    def send_msg(self):
        txt = self.input_field.text().strip()
        if not txt:
            return
        now_str = datetime.now().strftime("%I:%M %p")
        self.chat_history.append({"sender": "user", "text": txt, "time": now_str})
        self.input_field.clear()
        self.render_messages()
        save_app_data(self.db)
        
        # Simulated Auto-Reply with delay
        QTimer.singleShot(750 + random.randint(100, 500), lambda: self.auto_reply(txt))

    def auto_reply(self, prompt: str):
        p_lower = prompt.lower()
        now_str = datetime.now().strftime("%I:%M %p")
        
        if any(w in p_lower for w in ["emergency", "ambulance", "urgent", "sos", "critical"]):
            reply = f"🚨 FOR CRITICAL EMERGENCIES: Please call our 24/7 emergency room directly at {self.hospital['emergency']} or dial toll-free 102 immediately."
        elif any(w in p_lower for w in ["appointment", "book", "consult", "schedule"]):
            reply = f"To book an appointment at {self.hospital['name']}, you can use the 'Book Consultation' button on this app or call our OPD at {self.hospital['phone']}."
        elif any(w in p_lower for w in ["doctor", "specialist", "fee", "cardio", "neuro"]):
            reply = f"We have top NMC certified specialists across {', '.join(self.hospital.get('specialties', ['All Departments']))}. Please check the Doctors tab to view availability."
        else:
            reply = f"Thank you for contacting {self.hospital['name']}. Our patient care team has received your message and will assist you shortly. Call {self.hospital['phone']} for direct assistance."
            
        self.chat_history.append({"sender": "hospital", "text": reply, "time": now_str})
        self.render_messages()
        save_app_data(self.db)


# ═══════════════════════════════════════════════════════════
#  BOOK APPOINTMENT DIALOG
# ═══════════════════════════════════════════════════════════
class BookAppointmentDialog(QDialog):
    def __init__(self, doctors: list, current_user: dict, preselected_doc_id=None, parent=None):
        super().__init__(parent)
        self.doctors = doctors
        self.user = current_user
        self.result_appointment = None
        
        self.setWindowTitle(tr("book_dialog_title"))
        self.setMinimumWidth(500)
        self.setStyleSheet("""
            QDialog {
                background: #F8FAFC;
                font-family: 'Segoe UI', 'Noto Sans Devanagari', sans-serif;
            }
        """)
        
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)
        
        title_lbl = QLabel(f"🗓️ {tr('book_dialog_title')}")
        tf = QFont(); tf.setPointSize(14); tf.setBold(True); title_lbl.setFont(tf)
        title_lbl.setStyleSheet("color: #0284C7;")
        layout.addWidget(title_lbl)
        
        form = QFormLayout()
        form.setSpacing(12)
        
        # Doctor selector
        self.doc_combo = QComboBox()
        selected_idx = 0
        for i, d in enumerate(self.doctors):
            avail_tag = "✅" if d.get("available", True) else "⏳"
            self.doc_combo.addItem(f"{avail_tag} {d['name']} — {d['specialty']} (Rs. {d.get('fee_npr', 800)})", d["id"])
            if preselected_doc_id and d["id"] == preselected_doc_id:
                selected_idx = i
        self.doc_combo.setCurrentIndex(selected_idx)
        form.addRow(tr("select_doctor") + ":", self.doc_combo)
        
        # Date
        self.date_picker = QDateEdit()
        self.date_picker.setCalendarPopup(True)
        self.date_picker.setMinimumDate(QDate.currentDate())
        self.date_picker.setDate(QDate.currentDate().addDays(1))
        form.addRow(tr("consultation_date") + ":", self.date_picker)
        
        # Time
        self.time_combo = QComboBox()
        self.time_combo.addItems([
            "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
            "01:00 PM", "01:30 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
        ])
        form.addRow(tr("consultation_time") + ":", self.time_combo)
        
        # Mode
        self.mode_combo = QComboBox()
        self.mode_combo.addItems(["🎥 Video Teleconsultation", "🏥 In-Person OPD Clinic"])
        form.addRow(tr("consultation_mode") + ":", self.mode_combo)
        
        # Symptoms
        self.symptoms_edit = QTextEdit()
        self.symptoms_edit.setPlaceholderText("Briefly describe your symptoms, duration, and medical history...")
        self.symptoms_edit.setFixedHeight(90)
        form.addRow(tr("symptoms_notes") + ":", self.symptoms_edit)
        
        layout.addLayout(form)
        
        # Buttons
        btn_box = QHBoxLayout()
        btn_box.addStretch()
        
        cancel_btn = QPushButton(tr("btn_cancel"))
        cancel_btn.setObjectName("glassBtnSecondary")
        cancel_btn.clicked.connect(self.reject)
        
        confirm_btn = QPushButton(tr("btn_confirm_booking"))
        confirm_btn.setStyleSheet("background: #0284C7; font-weight:700;")
        confirm_btn.clicked.connect(self.save_booking)
        
        btn_box.addWidget(cancel_btn)
        btn_box.addWidget(confirm_btn)
        layout.addLayout(btn_box)

    def save_booking(self):
        doc_id = self.doc_combo.currentData()
        doc_obj = next((d for d in self.doctors if d["id"] == doc_id), self.doctors[0])
        
        q_date = self.date_picker.date()
        date_str = f"{q_date.year()}-{q_date.month():02d}-{q_date.day():02d}"
        
        self.result_appointment = {
            "id": f"apt_{uuid.uuid4().hex[:8]}",
            "patient_username": self.user["username"],
            "patient_name": self.user.get("full_name", self.user["username"]),
            "doctor_id": doc_obj["id"],
            "doctor_name": doc_obj["name"],
            "specialty": doc_obj["specialty"],
            "hospital": doc_obj.get("hospital", "Telemed Partner Hospital"),
            "date": date_str,
            "time": self.time_combo.currentText(),
            "type": self.mode_combo.currentText(),
            "status": "Confirmed",
            "symptoms": self.symptoms_edit.toPlainText().strip() or "General consultation requested.",
            "fee_npr": doc_obj.get("fee_npr", 1000),
            "meeting_link": f"https://telemednepal.org.np/room/{uuid.uuid4().hex[:6]}"
        }
        self.accept()


# ═══════════════════════════════════════════════════════════
#  MAIN APPLICATION WINDOW
# ═══════════════════════════════════════════════════════════
class TelemedNepalApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.db = load_app_data()
        self.current_user = self.db["users"][1] if len(self.db["users"]) > 1 else self.db["users"][0]
        self.is_dark_theme = False
        
        self.setWindowTitle(tr("app_title"))
        self.resize(1180, 780)
        self.setMinimumSize(980, 640)
        
        self.init_ui()
        self.apply_theme()

    def apply_theme(self):
        if self.is_dark_theme:
            self.setStyleSheet(DARK_GLASS_THEME)
        else:
            self.setStyleSheet(LIGHT_GLASS_THEME)

    def toggle_theme(self):
        self.is_dark_theme = not self.is_dark_theme
        self.apply_theme()
        btn_text = tr("toggle_theme_light") if self.is_dark_theme else tr("toggle_theme_dark")
        self.theme_btn.setText(btn_text)

    def toggle_language(self):
        global CURRENT_LANG
        CURRENT_LANG = "np" if CURRENT_LANG == "en" else "en"
        self.setWindowTitle(tr("app_title"))
        self.lang_btn.setText(tr("toggle_lang"))
        self.theme_btn.setText(tr("toggle_theme_light") if self.is_dark_theme else tr("toggle_theme_dark"))
        self.update_all_ui_texts()

    def init_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QVBoxLayout(central)
        main_layout.setContentsMargins(12, 12, 12, 12)
        main_layout.setSpacing(10)
        
        # ── Top Glass Navigation Bar ──
        nav_bar = QFrame()
        nav_bar.setObjectName("glassCard")
        nav_layout = QHBoxLayout(nav_bar)
        nav_layout.setContentsMargins(16, 10, 16, 10)
        
        # Logo & App Title
        logo_lbl = QLabel("🇳🇵 🏥")
        lf = QFont(); lf.setPointSize(22); logo_lbl.setFont(lf)
        logo_lbl.setStyleSheet("background: transparent;")
        
        title_box = QVBoxLayout()
        self.brand_title = QLabel("Telemed Nepal (टेलीमेड नेपाल)")
        btf = QFont(); btf.setPointSize(14); btf.setBold(True); self.brand_title.setFont(btf)
        self.brand_title.setStyleSheet("color: #0284C7; background: transparent;")
        
        self.brand_sub = QLabel(tr("tagline"))
        self.brand_sub.setStyleSheet("color: #64748B; font-size: 11px; background: transparent;")
        title_box.addWidget(self.brand_title)
        title_box.addWidget(self.brand_sub)
        
        nav_layout.addWidget(logo_lbl)
        nav_layout.addSpacing(6)
        nav_layout.addLayout(title_box)
        nav_layout.addStretch()
        
        # Language Toggle Button
        self.lang_btn = QPushButton(tr("toggle_lang"))
        self.lang_btn.setObjectName("glassBtnSecondary")
        self.lang_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self.lang_btn.clicked.connect(self.toggle_language)
        nav_layout.addWidget(self.lang_btn)
        
        # Theme Toggle Button
        self.theme_btn = QPushButton(tr("toggle_theme_dark"))
        self.theme_btn.setObjectName("glassBtnSecondary")
        self.theme_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self.theme_btn.clicked.connect(self.toggle_theme)
        nav_layout.addWidget(self.theme_btn)
        
        # User Info Capsule
        self.user_lbl = QLabel(f"👤 {self.current_user.get('full_name', self.current_user['username'])} ({self.current_user['role'].upper()})")
        self.user_lbl.setStyleSheet("font-weight: 700; color: #334155; padding: 6px 12px; background: rgba(255,255,255,0.6); border-radius: 12px;")
        nav_layout.addWidget(self.user_lbl)
        
        main_layout.addWidget(nav_bar)
        
        # ── Main Tab Widget ──
        self.tabs = QTabWidget()
        
        # Tab 1: Dashboard
        self.tab_dashboard = QWidget()
        self.setup_dashboard_tab()
        self.tabs.addTab(self.tab_dashboard, tr("tab_dashboard"))
        
        # Tab 2: Doctors
        self.tab_doctors = QWidget()
        self.setup_doctors_tab()
        self.tabs.addTab(self.tab_doctors, tr("tab_doctors"))
        
        # Tab 3: Hospitals & Helpdesk
        self.tab_hospitals = QWidget()
        self.setup_hospitals_tab()
        self.tabs.addTab(self.tab_hospitals, tr("tab_hospitals"))
        
        # Tab 4: Unified Patient Records (Appointments + Prescriptions + Vitals)
        self.tab_records = QWidget()
        self.setup_records_tab()
        self.tabs.addTab(self.tab_records, tr("tab_records"))
        
        # Tab 5: Emergency Directory
        self.tab_emergency = QWidget()
        self.setup_emergency_tab()
        self.tabs.addTab(self.tab_emergency, tr("tab_emergency"))
        
        main_layout.addWidget(self.tabs, 1)
        
        # Status Bar
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("🟢 Telemed Nepal v2.0 Online — Connected to National Health Grid")

    # ─────────────────────────────────────────────────────────
    #  TAB 1: DASHBOARD
    # ─────────────────────────────────────────────────────────
    def setup_dashboard_tab(self):
        layout = QVBoxLayout(self.tab_dashboard)
        layout.setContentsMargins(14, 14, 14, 14)
        layout.setSpacing(14)
        
        # Stat Cards Grid
        stats_layout = QHBoxLayout()
        stats_layout.setSpacing(12)
        
        self.card_docs = LiquidGlassStatCard("stat_doctors", len(self.db.get("doctors", [])), "👨‍⚕️", "#0284C7")
        self.card_hosps = LiquidGlassStatCard("stat_hospitals", len(self.db.get("hospitals", [])), "🏥", "#7C3AED")
        self.card_apts = LiquidGlassStatCard("stat_appointments", len(self.db.get("appointments", [])), "📑", "#10B981")
        self.card_emerg = LiquidGlassStatCard("stat_emergency", "102 (24/7)", "🚑", "#EF4444")
        
        stats_layout.addWidget(self.card_docs)
        stats_layout.addWidget(self.card_hosps)
        stats_layout.addWidget(self.card_apts)
        stats_layout.addWidget(self.card_emerg)
        layout.addLayout(stats_layout)
        
        # Middle Section (Splitter: Quick Actions + Daily Tip & Consultations)
        mid_splitter = QSplitter(Qt.Orientation.Horizontal)
        
        # Left Panel: Quick Action Launchpad
        left_card = QFrame()
        left_card.setObjectName("glassCard")
        lc_layout = QVBoxLayout(left_card)
        lc_layout.setContentsMargins(18, 18, 18, 18)
        
        self.qa_title = QLabel(f"⚡ {tr('quick_actions')}")
        qf = QFont(); qf.setPointSize(12); qf.setBold(True); self.qa_title.setFont(qf)
        self.qa_title.setStyleSheet("color: #0284C7;")
        lc_layout.addWidget(self.qa_title)
        lc_layout.addSpacing(6)
        
        self.btn_qa_book = QPushButton(tr("book_doctor"))
        self.btn_qa_book.clicked.connect(lambda: self.tabs.setCurrentIndex(1))
        
        self.btn_qa_chat = QPushButton(tr("chat_hospital"))
        self.btn_qa_chat.setObjectName("glassBtnPurple")
        self.btn_qa_chat.clicked.connect(lambda: self.tabs.setCurrentIndex(2))
        
        self.btn_qa_rec = QPushButton(tr("view_my_records"))
        self.btn_qa_rec.setObjectName("glassBtnSecondary")
        self.btn_qa_rec.clicked.connect(lambda: self.tabs.setCurrentIndex(3))
        
        self.btn_qa_amb = QPushButton(tr("call_ambulance"))
        self.btn_qa_amb.setObjectName("glassBtnDanger")
        self.btn_qa_amb.clicked.connect(lambda: self.tabs.setCurrentIndex(4))
        
        lc_layout.addWidget(self.btn_qa_book)
        lc_layout.addWidget(self.btn_qa_chat)
        lc_layout.addWidget(self.btn_qa_rec)
        lc_layout.addWidget(self.btn_qa_amb)
        lc_layout.addStretch()
        mid_splitter.addWidget(left_card)
        
        # Right Panel: Upcoming Consultations & Health Tip
        right_card = QFrame()
        right_card.setObjectName("glassCard")
        rc_layout = QVBoxLayout(right_card)
        rc_layout.setContentsMargins(18, 18, 18, 18)
        
        # Health Tip Banner
        tip_banner = QFrame()
        tip_banner.setStyleSheet("""
            QFrame {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                    stop:0 rgba(224, 242, 254, 0.9), stop:1 rgba(237, 233, 254, 0.9));
                border-radius: 12px;
                border: 1px solid rgba(2, 132, 199, 0.3);
            }
        """)
        tb_layout = QVBoxLayout(tip_banner)
        tb_layout.setContentsMargins(14, 12, 14, 12)
        self.tip_title = QLabel(tr("health_tip_title"))
        ttf = QFont(); ttf.setPointSize(10); ttf.setBold(True); self.tip_title.setFont(ttf)
        self.tip_title.setStyleSheet("color: #0369A1; background: transparent;")
        
        self.tip_desc = QLabel(tr("health_tip_text"))
        self.tip_desc.setWordWrap(True)
        self.tip_desc.setStyleSheet("color: #334155; font-size: 12px; background: transparent;")
        tb_layout.addWidget(self.tip_title)
        tb_layout.addWidget(self.tip_desc)
        rc_layout.addWidget(tip_banner)
        
        rc_layout.addSpacing(10)
        self.up_title = QLabel(f"📅 {tr('upcoming_consultations')}")
        uf = QFont(); uf.setPointSize(11); uf.setBold(True); self.up_title.setFont(uf)
        self.up_title.setStyleSheet("color: #0F172A;")
        rc_layout.addWidget(self.up_title)
        
        self.dash_apts_table = QTableWidget(0, 4)
        self.dash_apts_table.setHorizontalHeaderLabels([tr("date"), tr("doctor"), tr("type"), tr("status")])
        self.dash_apts_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.dash_apts_table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.dash_apts_table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        rc_layout.addWidget(self.dash_apts_table, 1)
        
        mid_splitter.addWidget(right_card)
        mid_splitter.setSizes([320, 680])
        layout.addWidget(mid_splitter, 1)
        
        self.refresh_dashboard_apts()

    def refresh_dashboard_apts(self):
        self.dash_apts_table.setRowCount(0)
        apts = self.db.get("appointments", [])
        for a in apts[:5]:
            r = self.dash_apts_table.rowCount()
            self.dash_apts_table.insertRow(r)
            self.dash_apts_table.setItem(r, 0, QTableWidgetItem(f"{a['date']} {a.get('time','')}"))
            self.dash_apts_table.setItem(r, 1, QTableWidgetItem(f"{a['doctor_name']} ({a['specialty']})"))
            self.dash_apts_table.setItem(r, 2, QTableWidgetItem(a.get("type", "Video")))
            self.dash_apts_table.setItem(r, 3, QTableWidgetItem(a.get("status", "Confirmed")))

    # ─────────────────────────────────────────────────────────
    #  TAB 2: DOCTORS DIRECTORY
    # ─────────────────────────────────────────────────────────
    def setup_doctors_tab(self):
        layout = QVBoxLayout(self.tab_doctors)
        layout.setContentsMargins(14, 14, 14, 14)
        layout.setSpacing(12)
        
        # Filter Bar
        filter_card = QFrame()
        filter_card.setObjectName("glassCard")
        fc_layout = QHBoxLayout(filter_card)
        fc_layout.setContentsMargins(14, 10, 14, 10)
        
        self.doc_search_input = QLineEdit()
        self.doc_search_input.setPlaceholderText(tr("search_doctors_placeholder"))
        self.doc_search_input.textChanged.connect(self.filter_doctors_list)
        
        self.spec_filter_combo = QComboBox()
        self.spec_filter_combo.addItem(tr("all_specialties"))
        specs = sorted(list({d["specialty"] for d in self.db.get("doctors", [])}))
        for s in specs:
            self.spec_filter_combo.addItem(s)
        self.spec_filter_combo.currentIndexChanged.connect(self.filter_doctors_list)
        
        self.avail_checkbox = QCheckBox(tr("filter_available"))
        self.avail_checkbox.stateChanged.connect(self.filter_doctors_list)
        
        fc_layout.addWidget(QLabel("🔍"))
        fc_layout.addWidget(self.doc_search_input, 2)
        fc_layout.addWidget(self.spec_filter_combo, 1)
        fc_layout.addWidget(self.avail_checkbox)
        layout.addWidget(filter_card)
        
        # Splitter: Left Doctors List, Right Doctor Detail Card
        split = QSplitter(Qt.Orientation.Horizontal)
        
        # Doctors Table
        self.doctors_table = QTableWidget(0, 5)
        self.doctors_table.setHorizontalHeaderLabels([
            tr("doctor"), tr("specialty"), tr("hospitals"), tr("fee"), tr("status")
        ])
        self.doctors_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.doctors_table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.doctors_table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        self.doctors_table.itemSelectionChanged.connect(self.on_doctor_selected)
        split.addWidget(self.doctors_table)
        
        # Doctor Profile Card
        self.doc_detail_card = QFrame()
        self.doc_detail_card.setObjectName("glassCard")
        dc_layout = QVBoxLayout(self.doc_detail_card)
        dc_layout.setContentsMargins(20, 20, 20, 20)
        
        self.doc_d_avatar = QLabel("👨‍⚕️")
        df = QFont(); df.setPointSize(42); self.doc_d_avatar.setFont(df)
        self.doc_d_avatar.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        self.doc_d_name = QLabel("Select a doctor")
        dnf = QFont(); dnf.setPointSize(14); dnf.setBold(True); self.doc_d_name.setFont(dnf)
        self.doc_d_name.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.doc_d_name.setStyleSheet("color: #0284C7;")
        
        self.doc_d_spec = QLabel("")
        self.doc_d_spec.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.doc_d_spec.setStyleSheet("color: #64748B; font-weight: 600;")
        
        self.doc_d_info_browser = QTextBrowser()
        self.doc_d_info_browser.setStyleSheet("background: rgba(255,255,255,0.7); border: none; border-radius: 10px; padding: 8px;")
        
        self.btn_book_doc = QPushButton(f"🗓️ {tr('btn_book_appointment')}")
        self.btn_book_doc.setStyleSheet("padding: 12px; font-size: 14px; font-weight: 700;")
        self.btn_book_doc.clicked.connect(self.book_selected_doctor)
        
        dc_layout.addWidget(self.doc_d_avatar)
        dc_layout.addWidget(self.doc_d_name)
        dc_layout.addWidget(self.doc_d_spec)
        dc_layout.addSpacing(10)
        dc_layout.addWidget(self.doc_d_info_browser, 1)
        dc_layout.addWidget(self.btn_book_doc)
        
        split.addWidget(self.doc_detail_card)
        split.setSizes([620, 380])
        layout.addWidget(split, 1)
        
        self.filter_doctors_list()

    def filter_doctors_list(self):
        query = self.doc_search_input.text().strip().lower()
        selected_spec = self.spec_filter_combo.currentText()
        only_avail = self.avail_checkbox.isChecked()
        
        self.doctors_table.setRowCount(0)
        all_docs = self.db.get("doctors", [])
        
        for d in all_docs:
            if selected_spec != tr("all_specialties") and d["specialty"] != selected_spec:
                continue
            if only_avail and not d.get("available", True):
                continue
            
            searchable = f"{d['name']} {d['specialty']} {d.get('hospital','')} {d.get('nmc_number','')}".lower()
            if query and query not in searchable:
                continue
            
            r = self.doctors_table.rowCount()
            self.doctors_table.insertRow(r)
            
            avail_txt = f"🟢 {tr('status_available')}" if d.get("available", True) else f"⏳ {tr('status_busy')}"
            
            item_name = QTableWidgetItem(d["name"])
            item_name.setData(Qt.ItemDataRole.UserRole, d["id"])
            self.doctors_table.setItem(r, 0, item_name)
            self.doctors_table.setItem(r, 1, QTableWidgetItem(d["specialty"]))
            self.doctors_table.setItem(r, 2, QTableWidgetItem(d.get("hospital", "General")))
            self.doctors_table.setItem(r, 3, QTableWidgetItem(f"Rs. {d.get('fee_npr', 800)}"))
            self.doctors_table.setItem(r, 4, QTableWidgetItem(avail_txt))
            
        if self.doctors_table.rowCount() > 0:
            self.doctors_table.selectRow(0)

    def on_doctor_selected(self):
        rows = self.doctors_table.selectedItems()
        if not rows:
            return
        doc_id = rows[0].data(Qt.ItemDataRole.UserRole)
        doc = next((d for d in self.db.get("doctors", []) if d["id"] == doc_id), None)
        if not doc:
            return
        
        self.doc_d_name.setText(doc["name"])
        self.doc_d_spec.setText(doc["specialty"])
        
        info_html = f"""
        <div style="font-family:'Segoe UI',sans-serif; line-height: 1.6; color:#1E293B;">
            <p><b>🎓 {tr('experience')}:</b> {doc.get('experience_years', 10)} years</p>
            <p><b>📜 Degrees:</b> {doc.get('degrees', 'MBBS, MD')}</p>
            <p><b>🏥 Hospital:</b> {doc.get('hospital', 'Partner Hospital')}</p>
            <p><b>🆔 {tr('nmc_no')}:</b> {doc.get('nmc_number', 'NMC-Reg')}</p>
            <p><b>💰 {tr('fee')}:</b> NPR {doc.get('fee_npr', 800)}</p>
            <p><b>🗣️ {tr('languages_spoken')}:</b> {', '.join(doc.get('languages', ['Nepali', 'English']))}</p>
            <p><b>⭐ Rating:</b> {doc.get('rating', 4.8)} / 5.0</p>
            <p><b>⏰ Schedule:</b> {doc.get('schedule', 'Sun-Fri (10 AM - 4 PM)')}</p>
        </div>
        """
        self.doc_d_info_browser.setHtml(info_html)

    def book_selected_doctor(self):
        rows = self.doctors_table.selectedItems()
        preselected_id = rows[0].data(Qt.ItemDataRole.UserRole) if rows else None
        
        dlg = BookAppointmentDialog(self.db.get("doctors", []), self.current_user, preselected_id, self)
        if dlg.exec():
            new_apt = dlg.result_appointment
            if "appointments" not in self.db:
                self.db["appointments"] = []
            self.db["appointments"].insert(0, new_apt)
            save_app_data(self.db)
            
            self.card_apts.update_value(len(self.db["appointments"]))
            self.refresh_dashboard_apts()
            self.refresh_records_views()
            QMessageBox.information(self, tr("booking_success"), f"{tr('booking_success')}\nDoctor: {new_apt['doctor_name']}\nDate: {new_apt['date']} at {new_apt['time']}")

    # ─────────────────────────────────────────────────────────
    #  TAB 3: HOSPITALS DIRECTORY & CHAT
    # ─────────────────────────────────────────────────────────
    def setup_hospitals_tab(self):
        layout = QVBoxLayout(self.tab_hospitals)
        layout.setContentsMargins(14, 14, 14, 14)
        layout.setSpacing(12)
        
        # Search Box
        search_card = QFrame()
        search_card.setObjectName("glassCard")
        sc_layout = QHBoxLayout(search_card)
        sc_layout.setContentsMargins(14, 10, 14, 10)
        
        self.hosp_search_input = QLineEdit()
        self.hosp_search_input.setPlaceholderText(tr("search_hospitals_placeholder"))
        self.hosp_search_input.textChanged.connect(self.filter_hospitals_table)
        
        sc_layout.addWidget(QLabel("🏥"))
        sc_layout.addWidget(self.hosp_search_input)
        layout.addWidget(search_card)
        
        # Hospitals Table
        self.hosp_table = QTableWidget(0, 6)
        self.hosp_table.setHorizontalHeaderLabels([
            "Hospital Name", "District", "Phone", "Emergency", "Type / ICU", "Action"
        ])
        self.hosp_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.hosp_table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.hosp_table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        layout.addWidget(self.hosp_table, 1)
        
        self.filter_hospitals_table()

    def filter_hospitals_table(self):
        q = self.hosp_search_input.text().strip().lower()
        self.hosp_table.setRowCount(0)
        
        for h in self.db.get("hospitals", []):
            searchable = f"{h['name']} {h.get('name_np','')} {h.get('district','')} {h.get('address','')} {','.join(h.get('specialties',[]))}".lower()
            if q and q not in searchable:
                continue
            
            r = self.hosp_table.rowCount()
            self.hosp_table.insertRow(r)
            
            display_name = h.get("name_np", h["name"]) if CURRENT_LANG == "np" else h["name"]
            icu_str = "ICU ✅" if h.get("icu") else "ICU ❌"
            type_str = f"{h.get('type','General')} • {icu_str}"
            
            self.hosp_table.setItem(r, 0, QTableWidgetItem(f"🏥 {display_name}"))
            self.hosp_table.setItem(r, 1, QTableWidgetItem(h.get("district", "Kathmandu")))
            self.hosp_table.setItem(r, 2, QTableWidgetItem(h.get("phone", "")))
            self.hosp_table.setItem(r, 3, QTableWidgetItem(f"🚨 {h.get('emergency', '')}"))
            self.hosp_table.setItem(r, 4, QTableWidgetItem(type_str))
            
            # Chat Button in Action column
            chat_btn = QPushButton(tr("btn_open_chat"))
            chat_btn.setObjectName("glassBtnPurple")
            chat_btn.setCursor(Qt.CursorShape.PointingHandCursor)
            chat_btn.clicked.connect(lambda _, hosp=h: self.open_hospital_chat(hosp))
            self.hosp_table.setCellWidget(r, 5, chat_btn)

    def open_hospital_chat(self, hospital: dict):
        dlg = HospitalChatDialog(hospital, self.current_user, self.db, self)
        dlg.exec()

    # ─────────────────────────────────────────────────────────
    #  TAB 4: UNIFIED PATIENT RECORDS
    # ─────────────────────────────────────────────────────────
    def setup_records_tab(self):
        layout = QVBoxLayout(self.tab_records)
        layout.setContentsMargins(14, 14, 14, 14)
        layout.setSpacing(12)
        
        # Header banner with patient stats
        p_card = QFrame()
        p_card.setObjectName("glassCard")
        pc_layout = QHBoxLayout(p_card)
        pc_layout.setContentsMargins(18, 12, 18, 12)
        
        p_icon = QLabel("🧑‍⚕️")
        pif = QFont(); pif.setPointSize(28); p_icon.setFont(pif)
        
        p_info = QVBoxLayout()
        self.p_title_lbl = QLabel(f"{self.current_user.get('full_name', self.current_user['username'])} — Medical Dossier")
        ptf = QFont(); ptf.setPointSize(13); ptf.setBold(True); self.p_title_lbl.setFont(ptf)
        self.p_title_lbl.setStyleSheet("color: #0284C7;")
        
        self.p_sub_lbl = QLabel(f"Blood Group: {self.current_user.get('blood_group', 'O+')} | Allergies: {', '.join(self.current_user.get('allergies', ['None']))} | Contact: {self.current_user.get('phone', '+977-9800000000')}")
        self.p_sub_lbl.setStyleSheet("color: #64748B; font-size: 12px;")
        
        p_info.addWidget(self.p_title_lbl)
        p_info.addWidget(self.p_sub_lbl)
        
        pc_layout.addWidget(p_icon)
        pc_layout.addSpacing(10)
        pc_layout.addLayout(p_info)
        pc_layout.addStretch()
        
        self.btn_new_rx = QPushButton(tr("btn_new_prescription"))
        self.btn_new_rx.setObjectName("glassBtnSuccess")
        self.btn_new_rx.clicked.connect(self.create_new_prescription_dialog)
        pc_layout.addWidget(self.btn_new_rx)
        layout.addWidget(p_card)
        
        # Splitter: Left has list of Appointments & Prescriptions tabs, Right has full Preview Card
        rec_splitter = QSplitter(Qt.Orientation.Horizontal)
        
        # Left Sub-tabs
        self.rec_subtabs = QTabWidget()
        
        # Subtab 1: Appointments List
        sub_apts = QWidget()
        sa_layout = QVBoxLayout(sub_apts)
        sa_layout.setContentsMargins(6, 6, 6, 6)
        self.rec_apts_table = QTableWidget(0, 4)
        self.rec_apts_table.setHorizontalHeaderLabels([tr("date"), tr("doctor"), tr("type"), tr("status")])
        self.rec_apts_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.rec_apts_table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.rec_apts_table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        self.rec_apts_table.itemSelectionChanged.connect(self.on_appointment_record_selected)
        sa_layout.addWidget(self.rec_apts_table)
        self.rec_subtabs.addTab(sub_apts, tr("sub_appointments"))
        
        # Subtab 2: Prescriptions List
        sub_rx = QWidget()
        sr_layout = QVBoxLayout(sub_rx)
        sr_layout.setContentsMargins(6, 6, 6, 6)
        self.rec_rx_table = QTableWidget(0, 3)
        self.rec_rx_table.setHorizontalHeaderLabels([tr("date"), tr("doctor"), tr("diagnosis")])
        self.rec_rx_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.rec_rx_table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.rec_rx_table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        self.rec_rx_table.itemSelectionChanged.connect(self.on_prescription_record_selected)
        sr_layout.addWidget(self.rec_rx_table)
        self.rec_subtabs.addTab(sub_rx, tr("sub_prescriptions"))
        
        rec_splitter.addWidget(self.rec_subtabs)
        
        # Right Preview Panel (Digital Document View)
        right_preview = QFrame()
        right_preview.setObjectName("glassCard")
        rp_layout = QVBoxLayout(right_preview)
        rp_layout.setContentsMargins(16, 16, 16, 16)
        
        self.preview_browser = QTextBrowser()
        self.preview_browser.setStyleSheet("background: rgba(255,255,255,0.9); border: 1px solid #CBD5E1; border-radius: 12px; padding: 14px;")
        
        # Actions bar on preview
        p_act_layout = QHBoxLayout()
        self.btn_action_video = QPushButton(tr("btn_join_video"))
        self.btn_action_video.clicked.connect(self.launch_video_room)
        
        self.btn_action_print = QPushButton(tr("btn_print_rx"))
        self.btn_action_print.setObjectName("glassBtnSecondary")
        self.btn_action_print.clicked.connect(lambda: QMessageBox.information(self, "Print Simulation", "Prescription PDF generated successfully. Sent to system printer."))
        
        p_act_layout.addWidget(self.btn_action_video)
        p_act_layout.addWidget(self.btn_action_print)
        
        rp_layout.addWidget(self.preview_browser, 1)
        rp_layout.addLayout(p_act_layout)
        
        rec_splitter.addWidget(right_preview)
        rec_splitter.setSizes([500, 500])
        layout.addWidget(rec_splitter, 1)
        
        self.refresh_records_views()

    def refresh_records_views(self):
        # Refresh Appointments
        self.rec_apts_table.setRowCount(0)
        apts = self.db.get("appointments", [])
        for a in apts:
            r = self.rec_apts_table.rowCount()
            self.rec_apts_table.insertRow(r)
            
            it = QTableWidgetItem(f"{a['date']} {a.get('time','')}")
            it.setData(Qt.ItemDataRole.UserRole, a["id"])
            self.rec_apts_table.setItem(r, 0, it)
            self.rec_apts_table.setItem(r, 1, QTableWidgetItem(a["doctor_name"]))
            self.rec_apts_table.setItem(r, 2, QTableWidgetItem(a.get("type", "Video")))
            self.rec_apts_table.setItem(r, 3, QTableWidgetItem(a.get("status", "Confirmed")))
            
        # Refresh Prescriptions
        self.rec_rx_table.setRowCount(0)
        rxs = self.db.get("prescriptions", [])
        for rx in rxs:
            r = self.rec_rx_table.rowCount()
            self.rec_rx_table.insertRow(r)
            
            it = QTableWidgetItem(rx.get("date", ""))
            it.setData(Qt.ItemDataRole.UserRole, rx["id"])
            self.rec_rx_table.setItem(r, 0, it)
            self.rec_rx_table.setItem(r, 1, QTableWidgetItem(rx.get("doctor_name", "")))
            self.rec_rx_table.setItem(r, 2, QTableWidgetItem(rx.get("diagnosis", "Consultation")))

        if self.rec_apts_table.rowCount() > 0:
            self.rec_apts_table.selectRow(0)

    def on_appointment_record_selected(self):
        items = self.rec_apts_table.selectedItems()
        if not items:
            return
        apt_id = items[0].data(Qt.ItemDataRole.UserRole)
        apt = next((a for a in self.db.get("appointments", []) if a["id"] == apt_id), None)
        if not apt:
            return
        
        html = f"""
        <div style="font-family:'Segoe UI',sans-serif; color:#0F172A;">
            <div style="border-bottom: 2px solid #0284C7; padding-bottom:8px; margin-bottom:12px;">
                <h2 style="color:#0284C7; margin:0;">📋 Teleconsultation Record</h2>
                <span style="color:#64748B; font-size:12px;">Ref: {apt['id']} | Status: <b>{apt.get('status','Confirmed')}</b></span>
            </div>
            
            <table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
                <tr><td style="color:#64748B; padding:4px 0;"><b>Patient:</b></td><td>{apt.get('patient_name', self.current_user.get('full_name'))}</td></tr>
                <tr><td style="color:#64748B; padding:4px 0;"><b>Doctor:</b></td><td><b>{apt['doctor_name']}</b> ({apt['specialty']})</td></tr>
                <tr><td style="color:#64748B; padding:4px 0;"><b>Hospital:</b></td><td>{apt.get('hospital','Nepal Medical Center')}</td></tr>
                <tr><td style="color:#64748B; padding:4px 0;"><b>Date & Time:</b></td><td>📅 {apt['date']} at ⏰ {apt.get('time','10:00 AM')}</td></tr>
                <tr><td style="color:#64748B; padding:4px 0;"><b>Mode:</b></td><td>{apt.get('type','Video Teleconsultation')}</td></tr>
                <tr><td style="color:#64748B; padding:4px 0;"><b>Fee Paid:</b></td><td>NPR {apt.get('fee_npr', 1000)}</td></tr>
            </table>
            
            <div style="background:#F1F5F9; border-radius:8px; padding:10px; margin-top:8px;">
                <h4 style="margin:0 0 6px 0; color:#334155;">🩺 Reported Symptoms:</h4>
                <p style="margin:0; font-size:13px; color:#1E293B;">{apt.get('symptoms','No specific notes provided.')}</p>
            </div>
            
            <div style="margin-top:14px; padding:10px; background:#ECFDF5; border-radius:8px; border:1px solid #A7F3D0;">
                <b>Secure Telemed Room:</b> <br/>
                <a href="{apt.get('meeting_link','#')}" style="color:#059669;">{apt.get('meeting_link','https://telemednepal.org.np/room/active')}</a>
            </div>
        </div>
        """
        self.preview_browser.setHtml(html)

    def on_prescription_record_selected(self):
        items = self.rec_rx_table.selectedItems()
        if not items:
            return
        rx_id = items[0].data(Qt.ItemDataRole.UserRole)
        rx = next((r for r in self.db.get("prescriptions", []) if r["id"] == rx_id), None)
        if not rx:
            return
        
        meds_html = ""
        for i, m in enumerate(rx.get("medicines", []), 1):
            meds_html += f"""
            <tr style="border-bottom:1px solid #E2E8F0;">
                <td style="padding:8px 4px;"><b>{i}. {m.get('name','')}</b><br/><span style="color:#64748B; font-size:11px;">{m.get('instructions','')}</span></td>
                <td style="padding:8px 4px;">{m.get('dosage','')}</td>
                <td style="padding:8px 4px;">{m.get('frequency','')}</td>
                <td style="padding:8px 4px;">{m.get('duration','')}</td>
            </tr>
            """
            
        html = f"""
        <div style="font-family:'Segoe UI',sans-serif; color:#0F172A; border:2px solid #E2E8F0; padding:16px; border-radius:10px; background:white;">
            <div style="text-align:center; border-bottom:2px solid #0284C7; padding-bottom:8px;">
                <h2 style="color:#0284C7; margin:0;">🇳🇵 TELEMED NEPAL DIGITAL RX</h2>
                <span style="font-size:12px; color:#64748B;">Government Recognized Telemedicine Prescription</span>
            </div>
            
            <div style="display:flex; justify-content:space-between; margin:12px 0; font-size:12px;">
                <div><b>Prescription No:</b> {rx['id']} | <b>Date:</b> {rx.get('date','')}</div>
                <div><b>Prescribing Doctor:</b> {rx.get('doctor_name','')} ({rx.get('specialty','')})</div>
                <div><b>Patient:</b> {rx.get('patient_name', self.current_user.get('full_name'))}</div>
            </div>
            
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:6px; padding:8px; margin-bottom:12px;">
                <b>Diagnosis:</b> <span style="color:#0369A1; font-weight:700;">{rx.get('diagnosis','General Assessment')}</span>
            </div>
            
            <h4 style="margin:10px 0 6px 0; color:#0284C7;">℞ Prescribed Medications:</h4>
            <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:12px;">
                <thead>
                    <tr style="background:#F1F5F9; color:#475569; text-align:left;">
                        <th style="padding:6px;">Medicine & Instructions</th>
                        <th style="padding:6px;">Dosage</th>
                        <th style="padding:6px;">Frequency</th>
                        <th style="padding:6px;">Duration</th>
                    </tr>
                </thead>
                <tbody>
                    {meds_html}
                </tbody>
            </table>
            
            <div style="font-size:12px; margin-top:10px;">
                <b>Advice & Lifestyle Notes:</b> {rx.get('lifestyle_advice', 'Follow prescribed regimen and maintain hydration.')}
            </div>
            <div style="font-size:12px; margin-top:6px; color:#DC2626;">
                <b>Follow-Up Date:</b> {rx.get('follow_up_date', 'As needed')}
            </div>
        </div>
        """
        self.preview_browser.setHtml(html)

    def launch_video_room(self):
        QMessageBox.information(self, "Teleconsultation Room", "Connecting to encrypted WebRTC video room...\nMicrophone and Camera initialized.\nWaiting for Doctor...")

    def create_new_prescription_dialog(self):
        dlg = QDialog(self)
        dlg.setWindowTitle("Issue Digital Prescription")
        dlg.setMinimumWidth(460)
        l = QVBoxLayout(dlg)
        
        form = QFormLayout()
        diag_in = QLineEdit()
        form.addRow("Diagnosis:", diag_in)
        
        med_in = QLineEdit()
        med_in.setPlaceholderText("e.g. Paracetamol 500mg (1-0-1 for 3 days)")
        form.addRow("Medication Details:", med_in)
        
        advice_in = QTextEdit()
        advice_in.setFixedHeight(60)
        form.addRow("Doctor Advice:", advice_in)
        l.addLayout(form)
        
        btns = QHBoxLayout()
        btns.addStretch()
        ok_btn = QPushButton("Save Prescription")
        ok_btn.setObjectName("glassBtnSuccess")
        ok_btn.clicked.connect(dlg.accept)
        btns.addWidget(ok_btn)
        l.addLayout(btns)
        
        if dlg.exec():
            new_rx = {
                "id": f"rx_{uuid.uuid4().hex[:8]}",
                "patient_username": self.current_user["username"],
                "patient_name": self.current_user.get("full_name", "Patient"),
                "doctor_name": "Dr. Ramesh Sharma",
                "specialty": "General Medicine",
                "date": str(date.today()),
                "diagnosis": diag_in.text().strip() or "General Follow-Up",
                "medicines": [
                    {
                        "name": med_in.text().strip() or "Multivitamin Capsule",
                        "dosage": "1 Capsule", "frequency": "Daily", "duration": "10 days",
                        "instructions": "Take after breakfast."
                    }
                ],
                "lifestyle_advice": advice_in.toPlainText().strip() or "Adequate rest and hydration.",
                "follow_up_date": "2026-09-10"
            }
            if "prescriptions" not in self.db:
                self.db["prescriptions"] = []
            self.db["prescriptions"].insert(0, new_rx)
            save_app_data(self.db)
            self.refresh_records_views()
            QMessageBox.information(self, "Saved", "New digital prescription recorded successfully.")

    # ─────────────────────────────────────────────────────────
    #  TAB 5: EMERGENCY DIRECTORY
    # ─────────────────────────────────────────────────────────
    def setup_emergency_tab(self):
        layout = QVBoxLayout(self.tab_emergency)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(14)
        
        banner = QFrame()
        banner.setStyleSheet("""
            QFrame {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 #DC2626, stop:1 #991B1B);
                border-radius: 14px;
            }
        """)
        b_layout = QHBoxLayout(banner)
        b_layout.setContentsMargins(20, 16, 20, 16)
        
        e_icon = QLabel("🚨")
        eif = QFont(); eif.setPointSize(36); e_icon.setFont(eif)
        
        e_text = QVBoxLayout()
        self.em_title = QLabel(tr("emergency_title"))
        emf = QFont(); emf.setPointSize(14); emf.setBold(True); self.em_title.setFont(emf)
        self.em_title.setStyleSheet("color: white; background: transparent;")
        
        self.em_sub = QLabel(tr("emergency_subtitle"))
        self.em_sub.setStyleSheet("color: rgba(255,255,255,0.9); font-size: 12px; background: transparent;")
        e_text.addWidget(self.em_title)
        e_text.addWidget(self.em_sub)
        
        b_layout.addWidget(e_icon)
        b_layout.addSpacing(12)
        b_layout.addLayout(e_text)
        b_layout.addStretch()
        layout.addWidget(banner)
        
        # Grid of Emergency Contacts
        grid = QGridLayout()
        grid.setSpacing(12)
        
        contacts = self.db.get("emergency_contacts", [
            {"name": "National Ambulance Helpline", "name_np": "राष्ट्रिय एम्बुलेन्स सेवा", "number": "102", "desc": "24/7 Dispatch across all districts."},
            {"name": "Nepal Police Emergency", "name_np": "नेपाल प्रहरी आपतकालीन नियन्त्रण", "number": "100", "desc": "Toll-free police dispatch."},
            {"name": "Traffic Police Control", "name_np": "ट्राफिक प्रहरी हेल्पलाइन", "number": "103", "desc": "Accident rescue & roadside assistance."},
            {"name": "Infectious Disease Epidemic Hotline", "name_np": "शुक्रराज सरुवा रोग हेल्पलाइन", "number": "1115", "desc": "Ministry of Health hotline."},
            {"name": "Mental Health Crisis Helpline", "name_np": "राष्ट्रिय मानसिक स्वास्थ्य सहायता", "number": "1166", "desc": "24/7 Confidential crisis support."}
        ])
        
        for idx, c in enumerate(contacts):
            c_card = QFrame()
            c_card.setObjectName("glassCard")
            c_layout = QVBoxLayout(c_card)
            c_layout.setContentsMargins(16, 14, 16, 14)
            
            c_name = c.get("name_np", c["name"]) if CURRENT_LANG == "np" else c["name"]
            n_lbl = QLabel(c_name)
            nf = QFont(); nf.setPointSize(11); nf.setBold(True); n_lbl.setFont(nf)
            n_lbl.setStyleSheet("color: #0F172A;")
            
            num_lbl = QLabel(f"📞 {c['number']}")
            num_f = QFont(); num_f.setPointSize(20); num_f.setBold(True); num_lbl.setFont(num_f)
            num_lbl.setStyleSheet("color: #DC2626;")
            
            desc_lbl = QLabel(c.get("desc", "Toll-free 24/7 service"))
            desc_lbl.setStyleSheet("color: #64748B; font-size: 11px;")
            desc_lbl.setWordWrap(True)
            
            call_btn = QPushButton(f"Call {c['number']}")
            call_btn.setObjectName("glassBtnDanger")
            call_btn.clicked.connect(lambda _, n=c['number']: QMessageBox.information(self, "Emergency Call", f"Calling emergency helpline: {n}..."))
            
            c_layout.addWidget(n_lbl)
            c_layout.addWidget(num_lbl)
            c_layout.addWidget(desc_lbl)
            c_layout.addSpacing(6)
            c_layout.addWidget(call_btn)
            
            grid.addWidget(c_card, idx // 3, idx % 3)
            
        layout.addLayout(grid)
        layout.addStretch()

    # ─────────────────────────────────────────────────────────
    #  LANGUAGE UPDATE HOOK
    # ─────────────────────────────────────────────────────────
    def update_all_ui_texts(self):
        self.brand_sub.setText(tr("tagline"))
        
        # Tabs
        self.tabs.setTabText(0, tr("tab_dashboard"))
        self.tabs.setTabText(1, tr("tab_doctors"))
        self.tabs.setTabText(2, tr("tab_hospitals"))
        self.tabs.setTabText(3, tr("tab_records"))
        self.tabs.setTabText(4, tr("tab_emergency"))
        
        # Stat cards
        self.card_docs.update_language()
        self.card_hosps.update_language()
        self.card_apts.update_language()
        self.card_emerg.update_language()
        
        # Dashboard
        self.qa_title.setText(f"⚡ {tr('quick_actions')}")
        self.btn_qa_book.setText(tr("book_doctor"))
        self.btn_qa_chat.setText(tr("chat_hospital"))
        self.btn_qa_rec.setText(tr("view_my_records"))
        self.btn_qa_amb.setText(tr("call_ambulance"))
        self.tip_title.setText(tr("health_tip_title"))
        self.tip_desc.setText(tr("health_tip_text"))
        self.up_title.setText(f"📅 {tr('upcoming_consultations')}")
        
        # Doctors
        self.doc_search_input.setPlaceholderText(tr("search_doctors_placeholder"))
        self.avail_checkbox.setText(tr("filter_available"))
        self.btn_book_doc.setText(f"🗓️ {tr('btn_book_appointment')}")
        self.filter_doctors_list()
        
        # Hospitals
        self.hosp_search_input.setPlaceholderText(tr("search_hospitals_placeholder"))
        self.filter_hospitals_table()
        
        # Records
        self.btn_new_rx.setText(tr("btn_new_prescription"))
        self.rec_subtabs.setTabText(0, tr("sub_appointments"))
        self.rec_subtabs.setTabText(1, tr("sub_prescriptions"))
        self.btn_action_video.setText(tr("btn_join_video"))
        self.btn_action_print.setText(tr("btn_print_rx"))
        self.refresh_records_views()


# ═══════════════════════════════════════════════════════════
#  ENTRY POINT
# ═══════════════════════════════════════════════════════════
def main():
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    
    # Set default app font
    font = QFont("Segoe UI", 10)
    app.setFont(font)
    
    window = TelemedNepalApp()
    window.show()
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
