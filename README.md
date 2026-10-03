# 🇳🇵 XENON HEALTH — Digital Healthcare & Telemedicine Platform for Nepal

**XENON HEALTH** is a production-grade, next-generation digital healthcare, telemedicine, and AI-assisted clinical triage platform engineered specifically for Nepal's unique geographical, medical, and high-altitude emergency needs.

---

## 🌟 Key Features

### 1. 🤖 Xenon AI Clinical Triage & Health Assistant
- **Bilingual Medical Intelligence:** Full fluency in Nepali (नेपाली) and English for conversational health evaluations.
- **Symptom Assessment & Red Flag Detection:** Instant clinical triage categorized by urgency (Emergency, Urgent OPD, Routine Care, Self-Care).
- **Himalayan & Altitude Specialization:** Dedicated analysis for High Altitude Pulmonary/Cerebral Edema (HAPE/HACE), hydration, and alpine hypothermia.
- **Voice-Enabled:** Integrated text-to-speech for patient accessibility in remote regions.

### 2. 👨‍⚕️ NMC Doctor Directory & Telemedicine Consultations
- **Verified Nepal Medical Council (NMC) Specialists:** General Physicians, Cardiologists, Pediatricians, Pulmonologists, Gynecologists, and Orthopedic Surgeons.
- **Direct OPD Scheduling:** Book virtual consultations and manage follow-ups.
- **Encrypted WebRTC Video Rooms:** Built-in high-definition tele-consultation rooms with live clinical vitals overlays.
- **Official Digital Prescriptions:** Doctors can author and digitally sign prescriptions with vital signs, dosages, and lifestyle advice.

### 3. 🚨 National Emergency & 102 Rescue Hotline
- **One-Tap SOS Hotlines:**
  - 🚑 **102** — National Ambulance Service (Nepal Red Cross / Nepal Ambulance Service)
  - 🚁 **01-4271109 / 9851080000** — Nepal Army High-Altitude Helicopter Rescue Dispatch
  - 🩸 **105** — National Central Blood Bank
  - 👮 **100** — Nepal Police Emergency
- **Offline Emergency Action Guides:** Pre-cached protocol steps for acute mountain sickness, snakebites, cardiac emergencies, and trauma stabilization.

### 4. 📑 Personal Health Vault & Confidential Records
- **Vitals Tracking:** Track resting Blood Pressure (BP), Pulse Rate, Blood Oxygen (SpO2), Blood Glucose, and Weight.
- **Lab Report & Prescription Archive:** Upload diagnostic imaging, blood panels, and PDF records with OCR & AI summarization.
- **Privacy Lock:** Biometric & PIN lock protecting sensitive patient medical history.

### 5. 🏥 Nepal Hospital & ICU Directory
- Comprehensive directory of major hospitals across Bagmati, Gandaki, Koshi, Lumbini, and remote provinces (e.g., TUTH Teaching Hospital, Bir Hospital, Patan Hospital, Grande International, Nepal Mediciti).
- Live ICU bed trackers, emergency contact numbers, and direct messaging channels.

### 6. 🔒 Robust Security & Role-Based Access Control (RBAC)
- **Automatic Auth Redirection:** Protected patient records, consultation histories, and clinical tools automatically require authentication before access.
- **Multi-Role Experience:**
  - **Patients:** Personalized health profile, active prescriptions, appointments, and daily health nuggets.
  - **Doctors:** NMC PIN login, clinical patient queue, digital prescription pad, and telemedicine suite.
  - **Administrators/Developers:** System telemetry, mock database management, and appointment overrides.

### 7. 📶 Offline-First Resiliency
- Built-in background synchronization queue for remote Himalayan and rural areas with intermittent connectivity.
- Locally caches pending consultations and health records, automatically pushing updates to the central database when internet connection is restored.

---

## 🛠️ Technology Stack

- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/), Lucide Icons, Motion
- **Backend / Dev Server:** Node.js, [Express](https://expressjs.com/), `tsx`, `esbuild`
- **AI Engine:** [@google/genai](https://www.npmjs.com/package/@google/genai) (Google Gemini Flash Models)
- **Storage & State:** Web Storage API (localStorage / sessionStorage) + Background Sync Service Worker

---

## 📁 Project Structure

```text
├── src/
│   ├── components/
│   │   ├── AuthModal.tsx             # Secure login, patient registration & doctor PIN auth
│   │   ├── BookModal.tsx             # OPD appointment booking & telemedicine scheduling
│   │   ├── ChatModal.tsx             # Direct hospital & clinic emergency chat
│   │   ├── DashboardView.tsx         # Patient health identity, vitals & curated health advice
│   │   ├── DeveloperConsoleView.tsx  # Admin data management & system simulation
│   │   ├── DoctorPortalView.tsx      # Clinical workspace for NMC medical specialists
│   │   ├── EmergencyView.tsx         # 102 ambulance & Nepal Army helicopter rescue directory
│   │   ├── HospitalsView.tsx         # Hospital search, ICU availability & emergency lines
│   │   ├── IssueRxModal.tsx          # Digital prescription generator with NMC sign-off
│   │   ├── LabReportsView.tsx        # Diagnostic lab reports, AI OCR & clinical trends
│   │   ├── MedicationReminderCard.tsx# Daily medication schedule & reminder notifications
│   │   ├── MobileBottomNav.tsx       # Ergonomic thumb navigation for mobile screens
│   │   ├── Navbar.tsx                # Top responsive navigation & user profile dropdown
│   │   ├── OfflineGuideView.tsx      # Offline high-altitude first aid & emergency guide
│   │   ├── PersonalHealthVault.tsx   # Comprehensive medical records & vitals tracker
│   │   ├── RecordsPrivacyLock.tsx    # Privacy PIN & biometric vault lock
│   │   ├── SyncStatusBar.tsx         # Offline-to-online background sync indicator
│   │   ├── VideoRoomModal.tsx        # Telemedicine video consultation suite
│   │   └── XenonAiView.tsx           # Bilingual AI medical triage assistant
│   ├── data/
│   │   └── mockData.ts               # Curated Nepal medical datasets, hospitals & doctors
│   ├── services/
│   │   ├── geminiService.ts          # Server & client Gemini AI triage logic
│   │   └── syncService.ts            # Offline persistence & background sync manager
│   ├── App.tsx                       # Root application component & route guards
│   ├── index.css                     # Global Tailwind CSS directives & typography
│   ├── main.tsx                      # Vite React entrypoint
│   └── types.ts                      # Shared TypeScript definitions & schemas
├── server.ts                         # Express server with Vite middleware & API routes
├── package.json                      # NPM dependencies & scripts
├── tsconfig.json                     # TypeScript compiler configuration
└── vite.config.ts                    # Vite build & bundler configuration
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory (optional for local API keys):
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 3. Development Server
Start the local full-stack development server:
```bash
npm run dev
```
Open your browser and navigate to: `http://localhost:3000`

### 4. Build & Production
To build the application for production:
```bash
npm run build
```
To run the production build:
```bash
npm start
```

### 5. Type Checking & Linting
```bash
npm run lint
```

---

## 🔒 Privacy & Safety Notice

- **Medical Disclaimer:** Xenon AI provides clinical health education and preliminary triage based on medical protocols; it does not replace in-person diagnosis by a licensed physician. In case of life-threatening emergencies, call **102** or contact the nearest emergency department immediately.
- **Data Security:** Personal health records are stored with local encryption and authenticated session verification.

---

## 📄 License
MIT License © 2026 XENON HEALTH Nepal. All rights reserved.
