# 🇳🇵 Telemed Nepal v2.0 — Glassmorphism Edition
> **Smart Telemedicine & Healthcare Directory Platform for Nepal**  
> *नेपालभर भरपर्दो, आधुनिक र डिजिटल स्वास्थ्य सेवा*

---

## 🌟 Key Features

### 1. 🪟 "Liquid Glass" (Glassmorphism) UI Design
- Frosted semi-transparent container cards (`rgba(255, 255, 255, 0.7)` on light / `rgba(30, 41, 59, 0.65)` on dark).
- Custom soft linear gradients, translucent 1px borders, smooth 16px corner radii, and sleek hover feedback.
- Instant **☀️ Light / 🌙 Dark Mode** toggle.

### 2. 🌐 Complete English / Nepali (नेपाली) Translation Toggle
- Dynamic real-time language switching (`🌐 English` ⇄ `🇳🇵 नेपाली`) with zero restart required.
- Full dictionary covering navigation tabs, action buttons, stat cards, doctor specialties in Devanagari, hospital names, form labels, and emergency dispatches.

### 3. 👨‍⚕️ 16+ Doctors across Top Specialties
- Enriched dataset with **NMC Registration Numbers**, degree credentials (MBBS, MD, DM, MCh), hospital affiliations, consultation fees in NPR, language proficiencies, and live availability indicators.
- Filter by specialty (Cardiology, Orthopedics, Pediatrics, Gynecology, Neurology, Dermatology, Psychiatry, etc.) and search by keyword.

### 4. 📑 Unified "Patient Records" Experience
- Single, intuitive dossier uniting **Appointments & Consultations** with **Digital Prescriptions (Rx)**.
- Integrated digital prescription viewer displaying clinic header, patient vitals, diagnosis, medication dosage matrix (frequency, duration, instructions), and doctor advice.
- One-click Teleconsultation WebRTC video room launcher and printable prescription workflow.

### 5. 🏥 Hospital Registry & Live Helpdesk Chat
- Complete directory of premier Nepalese tertiary and teaching hospitals across Kathmandu, Lalitpur, Pokhara, and more.
- Real-time in-app hospital chat with an automated query response engine handling appointment queries, emergency dispatch, and OPD doctor timings.

### 6. 🚨 National Emergency Directory
- Instant direct call buttons for Nepal's emergency hotlines:
  - **102**: National Ambulance Dispatch (Red Cross 24/7)
  - **100**: Nepal Police Emergency
  - **103**: Traffic Police Helpdesk
  - **1115**: Epidemic & Infectious Disease Hotline
  - **1166**: National Mental Health & Crisis Support

---

## 🚀 Installation & Running

### Prerequisites
- Python 3.9+ installed
- PyQt6 and bcrypt

```bash
# 1. Navigate to the folder
cd telemed_app

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the application
python telemed_nepal_v2.py
```

---

## 📂 Project Structure

```
telemed_app/
├── telemed_nepal_v2.py     # Main PyQt6 application with Liquid Glass UI & Nepali Localization
├── telemed_nepal_data.json # Seed database (Hospitals, 16 Doctors, Users, Appointments, Prescriptions)
├── requirements.txt        # Python dependency specifications (PyQt6, bcrypt)
├── README.md               # Complete platform documentation & developer guide
└── run.sh                  # One-click startup shell script
```

---

## 👥 Demo User Credentials

| Username | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| `admin` | *(any)* | System Admin | Full system oversight |
| `dr_ramesh` | *(any)* | Doctor (Cardiology) | Doctor portal & prescription manager |
| `patient_nepal` | *(any)* | Patient | Standard patient account with appointment history |
| `patient_bina` | *(any)* | Patient | Patient with prenatal checkup records |

---

*Developed with ❤️ for Nepal Healthcare Digitalization.*
