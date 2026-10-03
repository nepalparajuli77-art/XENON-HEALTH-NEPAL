package com.example.telemednepal.data.repository

import com.example.telemednepal.data.local.AppDatabase
import com.example.telemednepal.data.model.Appointment
import com.example.telemednepal.data.model.Doctor
import com.example.telemednepal.data.model.EmergencyContact
import com.example.telemednepal.data.model.Hospital
import com.example.telemednepal.data.model.Language
import com.example.telemednepal.data.model.Prescription
import com.example.telemednepal.data.model.TriageResult
import com.example.telemednepal.data.model.User
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class TelemedRepository(private val database: AppDatabase) {

    private val doctorDao = database.doctorDao()
    private val hospitalDao = database.hospitalDao()
    private val appointmentDao = database.appointmentDao()
    private val prescriptionDao = database.prescriptionDao()
    private val userDao = database.userDao()

    private val _currentUser = MutableStateFlow<User?>(
        User(
            id = "usr_004",
            username = "patient_nepal",
            role = "patient",
            fullName = "Nepal Parajuli",
            phone = "+977-9818765432",
            email = "nepal.parajuli.77@gmail.com",
            bloodGroup = "O+",
            age = 29,
            gender = "Male",
            district = "Kathmandu",
            address = "Baneshwor, Kathmandu",
            allergies = "Penicillin",
            emergencyContact = "+977-9801122334"
        )
    )
    val currentUser: Flow<User?> = _currentUser.asStateFlow()

    init {
        CoroutineScope(Dispatchers.IO).launch {
            seedDatabaseIfEmpty()
        }
    }

    val doctors: Flow<List<Doctor>> = doctorDao.getAllDoctors()
    val hospitals: Flow<List<Hospital>> = hospitalDao.getAllHospitals()
    val appointments: Flow<List<Appointment>> = appointmentDao.getAllAppointments()
    val prescriptions: Flow<List<Prescription>> = prescriptionDao.getAllPrescriptions()

    suspend fun bookAppointment(appointment: Appointment) = withContext(Dispatchers.IO) {
        appointmentDao.insertAppointment(appointment)
    }

    suspend fun issuePrescription(prescription: Prescription) = withContext(Dispatchers.IO) {
        prescriptionDao.insertPrescription(prescription)
    }

    suspend fun login(identifier: String, password: String):Result<User> = withContext(Dispatchers.IO) {
        val cleanId = identifier.trim().lowercase()
        if (cleanId == "admin" || cleanId.contains("admin")) {
            val adminUser = User(
                id = "usr_001",
                username = "admin",
                role = "admin",
                fullName = "System Administrator",
                phone = "+977-9801234567",
                email = "admin@telemednepal.org.np"
            )
            _currentUser.value = adminUser
            return@withContext Result.success(adminUser)
        }

        if (cleanId.contains("nepal.parajuli") || cleanId == "patient_nepal") {
            val patientUser = User(
                id = "usr_004",
                username = "patient_nepal",
                role = "patient",
                fullName = "Nepal Parajuli",
                phone = "+977-9818765432",
                email = "nepal.parajuli.77@gmail.com",
                bloodGroup = "O+",
                age = 29,
                gender = "Male",
                district = "Kathmandu",
                address = "Baneshwor, Kathmandu",
                allergies = "Penicillin",
                emergencyContact = "+977-9801122334"
            )
            _currentUser.value = patientUser
            return@withContext Result.success(patientUser)
        }

        val found = userDao.getUserByUsernameOrEmail(cleanId, cleanId)
        if (found != null) {
            _currentUser.value = found
            Result.success(found)
        } else {
            val guestUser = User(
                id = "usr_${System.currentTimeMillis()}",
                username = cleanId,
                role = "patient",
                fullName = identifier,
                phone = "+977-9800000000",
                email = "$cleanId@telemed.np"
            )
            userDao.insertUser(guestUser)
            _currentUser.value = guestUser
            Result.success(guestUser)
        }
    }

    suspend fun registerPatient(user: User): Result<User> = withContext(Dispatchers.IO) {
        userDao.insertUser(user)
        _currentUser.value = user
        Result.success(user)
    }

    suspend fun registerDoctor(doctor: Doctor, user: User): Result<User> = withContext(Dispatchers.IO) {
        doctorDao.insertDoctor(doctor)
        userDao.insertUser(user)
        _currentUser.value = user
        Result.success(user)
    }

    fun switchUserRole(role: String) {
        val curr = _currentUser.value ?: return
        _currentUser.value = curr.copy(role = role)
    }

    fun logout() {
        _currentUser.value = null
    }

    fun setCurrentUser(user: User) {
        _currentUser.value = user
    }

    // Comprehensive Nepal Clinical Triage Engine
    fun evaluateClinicalTriage(query: String, lang: Language): TriageResult {
        val q = query.lowercase()

        // 1. Snakebite / Rabies / Animal bite
        if (q.contains("snake") || q.contains("bite") || q.contains("dog") || q.contains("कुकुर") || q.contains("सर्प") || q.contains("rabies")) {
            val isSnake = q.contains("snake") || q.contains("सर्प")
            if (isSnake) {
                return TriageResult(
                    reply = if (lang == Language.NP)
                        "🚨 अत्यन्त जरुरी: सर्पदंश (Snakebite Emergency Protocol)\n\n१. बिरामीलाई शान्त राख्नुहोस्। हात वा खुट्टा नहल्लाउनुहोस् (Immobilize with splint)।\n२. ब्लेडले चिर्ने वा चुस्ने नगर्नुहोस्। डोरीले कसेर नबाँध्नुहोस्।\n३. घडी, औंठी, जुत्ता तुरुन्त फुकाल्नुहोस्।\n४. तुरुन्त एण्टी-स्नेक भेनम भएको पाटन अस्पताल वा वीर अस्पताल जानुहोस्।"
                    else
                        "🚨 RED ALERT: SUSPECTED VENOMOUS SNAKEBITE\n\n1. Strict Immobilization: Keep patient calm. Splint affected limb below heart level.\n2. DO NOT cut with blades, suck venom, or use tight tourniquets.\n3. Remove rings, watches, tight clothes before swelling occurs.\n4. Rapid Transport to Anti-Snake Venom (ASV) Center: Bir Hospital or Patan Hospital immediately.",
                    severity = "critical",
                    firstAidSteps = listOf(
                        "Immobilize bitten limb below heart level with splint",
                        "Keep patient completely still to slow venom circulation",
                        "Do NOT cut, suck, or tie tourniquets",
                        "Remove jewelry/tight items immediately",
                        "Transport to Anti-Snake Venom (ASV) emergency center immediately"
                    ),
                    recommendedSpecialty = "Toxicology & Emergency Critical Care",
                    recommendedHospital = "Patan Hospital, Bir Hospital, or Sukraraj Tropical Teku"
                )
            } else {
                return TriageResult(
                    reply = if (lang == Language.NP)
                        "⚠️ कुकुर वा जनावरको टोकाइ: रेबिज रोकथाम प्रोटोकल (Category III Bite)\n\n१. धाराको बगिरहेको सफा पानी र साबुनले कम्तीमा १५ मिनेट नरोकी घाउ धुनुहोस्।\n२. बेटाडिन (Povidone-iodine) लगाउनुहोस्। बेसार वा माटो कहिल्यै नहाल्नुहोस्।\n३. घाउमा टाँका नलगाउनुहोस्।\n४. तुरुन्त सुक्रराज ट्रपिकल अस्पताल टेकु गई रेबिज विरुद्धको खोप (ARV) र RIG लिनुहोस्।"
                    else
                        "⚠️ CLINICAL EMERGENCY: ANIMAL / DOG BITE (RABIES PEP PROTOCOL)\n\n1. Immediate Mechanical Cleansing: Flush bite wound with running tap water and soap for at least 15 continuous minutes.\n2. Apply 10% Povidone-Iodine antiseptic. Do NOT apply home powders.\n3. Do not stitch bite wounds.\n4. Urgent Rabies Immunization: Head to Sukraraj Tropical Hospital (Teku) for Anti-Rabies Vaccine (ARV) + Rabies Immunoglobulin (RIG).",
                    severity = "critical",
                    firstAidSteps = listOf(
                        "Wash wound under running tap water with soap for 15 minutes",
                        "Apply 10% Povidone-Iodine antiseptic",
                        "Do NOT stitch or bandage tightly",
                        "Receive ARV + RIG immediately",
                        "Administer Tetanus Toxoid within 24 hours"
                    ),
                    recommendedSpecialty = "Infectious Diseases / Post-Exposure Rabies Clinic",
                    recommendedHospital = "Sukraraj Tropical & Infectious Disease Hospital Teku"
                )
            }
        }

        // 2. Active Bleeding / Cut / Laceration
        if (q.contains("bleed") || q.contains("blood") || q.contains("cut") || q.contains("wound") || q.contains("रगत") || q.contains("घाउ")) {
            return TriageResult(
                reply = if (lang == Language.NP)
                    "🚨 तत्काल प्राथमिक उपचार: रगत बग्ने घाउ\n\n१. लगातार प्रत्यक्ष दबाब (Direct Pressure): सफा कपडाले घाउमा १० मिनेटसम्म नछोडी थिच्नुहोस्।\n२. हात/खुट्टा मुटुभन्दा माथि उठाउनुहोस् (Elevation)।\n३. धुलो, खरानी वा बेसार नहाल्नुहोस्।\n४. औंला चलाएर हेर्नुहोस्, नसा काटिएको हुन सक्छ।\n५. वीर अस्पताल ट्रमा सेन्टर जानुहोस् र धनुष्टंकार (Tetanus) खोप लगाउनुहोस्।"
                else
                    "🚨 EMERGENCY FIRST AID: ACTIVE BLEEDING / LACERATION\n\n1. Continuous Direct Pressure: Firmly press sterile gauze or clean cloth over wound for 10 uninterrupted minutes.\n2. Limb Elevation: Keep elevated above heart level.\n3. Avoid Contamination: Never apply ash, turmeric, or powders.\n4. Check Digit Movement: Test motor function and sensation.\n5. Tetanus Booster & Hospital Care: Visit Trauma Centre or Emergency OPD.",
                severity = "critical",
                firstAidSteps = listOf(
                    "Apply continuous direct pressure with clean cloth for 10 min",
                    "Elevate injured limb above heart level",
                    "Never apply ash, dirt, or turmeric",
                    "Check finger movement & sensation to rule out nerve damage",
                    "Get Tetanus Toxoid shot within 24 hours"
                ),
                recommendedSpecialty = "Trauma & Emergency Surgery",
                recommendedHospital = "National Trauma Centre (Bir Hospital Complex) or Patan Hospital"
            )
        }

        // 3. Chest Pain / Cardiac
        if (q.contains("chest") || q.contains("heart") || q.contains("attack") || q.contains("छाती") || q.contains("मुटु")) {
            return TriageResult(
                reply = if (lang == Language.NP)
                    "🚨 अत्यन्त जरुरी: छाती दुख्ने / हृदयाघातको आशंका\n\n१. तुरुन्त विश्राम लिनुहोस्, नहिँड्नुहोस्। बस्नुहोस्।\n२. एस्पिरिन ३०० मिग्रा (Aspirin 300mg) तुरुन्त चपाएर निल्नुहोस्।\n३. लुगा खुकुलो पार्नुहोस्।\n४. तुरुन्त एम्बुलेन्स १०२ मा फोन गरी गंगालाल हृदय केन्द्र जानुहोस्।"
                else
                    "🚨 RED ALERT: POTENTIAL CARDIAC EMERGENCY / CHEST PAIN\n\n1. Immediate Rest: Sit comfortably upright in semi-Fowler position. Avoid any exertion.\n2. Aspirin Therapy: Chew 300mg Aspirin immediately (if not allergic).\n3. Loosen tight clothing to assist breathing.\n4. Dial 102 Ambulance immediately: Transport to 24/7 Cath-Lab facility.",
                severity = "critical",
                firstAidSteps = listOf(
                    "Rest seated immediately; stop all physical exertion",
                    "Chew 300mg Aspirin if no allergy or active GI bleeding",
                    "Loosen tight collar, tie, and waistband",
                    "Call Nepal Emergency Ambulance 102 immediately"
                ),
                recommendedSpecialty = "Interventional Cardiology / Critical Care",
                recommendedHospital = "Shahid Gangalal National Heart Centre or Norvic Hospital"
            )
        }

        // 4. Altitude Sickness / AMS / HAPE
        if (q.contains("altitude") || q.contains("mountain") || q.contains("trek") || q.contains("himalaya") || q.contains("उचाइ") || q.contains("लेक")) {
            return TriageResult(
                reply = if (lang == Language.NP)
                    "⚠️ लेक लाग्ने समस्या (Acute Mountain Sickness - AMS)\n\n१. सुनौलो नियम: लक्षण देखिनासाथ माथि नजानुहोस्।\n२. ओरालो झर्नुहोस् (Descend Immediately): ३०० देखि ५०० मिटर तल झर्नु नै जीवन बचाउने उपाय हो।\n३. उपलब्ध भए अक्सिजन दिनुहोस्। डाक्टरको सल्लाहमा Diamox लिन सकिन्छ।\n४. खुट्टा लरबराएमा वा सास फेर्न गाह्रो भए तुरुन्त उद्धार हेलिकप्टर बोलाउनुहोस्।"
                else
                    "⚠️ HIGH-ALTITUDE MEDICINE PROTOCOL (AMS / HAPE / HACE)\n\n1. The Golden Rule: Never ascend with symptoms of altitude sickness.\n2. Descent Saves Lives: Descend 500m to 1,000m immediately.\n3. Supplemental oxygen and Diamox (Acetazolamide) 250mg.\n4. Call Air Rescue / Helicopter evacuation if ataxia or pulmonary distress occurs.",
                severity = "urgent",
                firstAidSteps = listOf(
                    "Halt ascent immediately; never climb higher with symptoms",
                    "Immediate descent of at least 500-1000m",
                    "Administer supplemental oxygen if available",
                    "Coordinate emergency alpine helicopter dispatch (+977-01-4246950)"
                ),
                recommendedSpecialty = "Mountain Medicine & Pulmonary Critical Care",
                recommendedHospital = "CIWEC Hospital Kathmandu/Pokhara or Himalayan Rescue Association"
            )
        }

        // 5. Burns
        if (q.contains("burn") || q.contains("scald") || q.contains("पोलेको") || q.contains("आगो")) {
            return TriageResult(
                reply = if (lang == Language.NP)
                    "⚠️ प्राथमिक उपचार: आगो वा तातो पानीले पोलेको अवस्था\n\n१. कम्तीमा १५ देखि २० मिनेटसम्म सफा चिसो बगिरहेको पानीले पखाल्नुहोस्।\n२. बरफ वा मञ्जन कहिल्यै नलगाउनुहोस्।\n३. फोकाहरू (Blisters) नफुटाउनुहोस्।\n४. कीर्तिपुर बर्न सेन्टर वा वीर अस्पताल जानुहोस्।"
                else
                    "⚠️ CLINICAL FIRST AID: THERMAL BURN\n\n1. Cool running tap water for 15-20 continuous minutes.\n2. Do NOT apply ice cubes, toothpaste, or ghee.\n3. Never pop intact blisters.\n4. Cover loosely with sterile film and transport to Kirtipur Hospital Burn Centre.",
                severity = "urgent",
                firstAidSteps = listOf(
                    "Cool with clean running water for 15-20 continuous minutes",
                    "Remove rings/bangles before swelling starts",
                    "Do NOT apply ice, butter, or toothpaste",
                    "Cover with clean non-stick film",
                    "Head to Kirtipur Hospital Burn Centre"
                ),
                recommendedSpecialty = "Plastic Surgery & Burn Unit",
                recommendedHospital = "Kirtipur Hospital Burn Centre or Bir Hospital Burn Ward"
            )
        }

        // Default clinical guidance
        return TriageResult(
            reply = if (lang == Language.NP)
                "नमस्ते! म जिनोन एआई (Xenon AI), टेलीमेड नेपालको क्लिनिकल ट्राइएज सहायक हुँ। तपाईंको स्वास्थ्य समस्या वा लक्षणहरू विस्तारमा बताउनुहोस् (जस्तै: ज्वरो, घाउ, दुखाइ, रक्तचाप वा औषधिको जानकारी)। आपतकालीन अवस्थामा सिधै १०२ मा कल गर्नुहोस्।"
            else
                "Hello! I am Xenon AI, Telemed Nepal's clinical triage and health intelligence assistant. Please describe your symptoms (e.g. onset, severity, location, associated conditions). For acute life-threatening emergencies, call Nepal National Ambulance 102 immediately.",
            severity = "routine",
            firstAidSteps = listOf(
                "Rest in a well-ventilated, comfortable position",
                "Stay hydrated with clean boiled water or ORS",
                "Monitor vitals (temperature, pulse, BP if available)",
                "Book a teleconsultation with a certified specialist"
            ),
            recommendedSpecialty = "General Medicine / Internal Medicine",
            recommendedHospital = "TU Teaching Hospital (TUTH) or Patan Hospital"
        )
    }

    val emergencyContacts: List<EmergencyContact> = listOf(
        EmergencyContact(
            name = "Nepal Army Emergency Air Rescue & Helicopter Ops",
            nameNp = "नेपाली सेना आपतकालीन हेलिकप्टर उद्धार निर्देशनालय",
            number = "+977014246950",
            desc = "24/7 Directorate of Air Operations & High-Altitude Medical Evacuation (MEDEVAC). Coordinates emergency helicopter dispatch for critical trauma, remote maternal emergencies, and alpine rescue.",
            category = "air-ambulance",
            badge = "Air Rescue / Medevac",
            icon = "🚁"
        ),
        EmergencyContact(
            name = "DJI FlyCart 30 Remote Drone Medical Cargo Dispatch",
            nameNp = "DJI FlyCart 30 मेडिकल ड्रोन ढुवानी तथा आपूर्ति",
            number = "+977015970102",
            desc = "Autonomous aerial cargo & high-altitude medical payload drone operations (30kg-40kg payload, up to 6,000m elevation). Rapid delivery of anti-snake venom, blood units, and emergency vaccines to remote health posts.",
            category = "drone-delivery",
            badge = "Drone Cargo (30-40kg)",
            icon = "🛸"
        ),
        EmergencyContact(
            name = "National Emergency Ambulance Hotline",
            nameNp = "राष्ट्रिय एम्बुलेन्स सेवा",
            number = "102",
            desc = "Toll-free 24/7 Nepal Red Cross ambulance dispatch across all 77 districts.",
            category = "national-helpline",
            badge = "Ground Dispatch",
            icon = "🚑"
        ),
        EmergencyContact(
            name = "Nepal Police Emergency Response",
            nameNp = "नेपाल प्रहरी आपतकालीन नियन्त्रण",
            number = "100",
            desc = "Toll-free 24/7 Police control room & disaster incident response.",
            category = "police",
            badge = "Police 24/7",
            icon = "👮"
        ),
        EmergencyContact(
            name = "Traffic Police Help Line",
            nameNp = "ट्राफिक प्रहरी हेल्पलाइन",
            number = "103",
            desc = "For road accidents, highway clearance, and emergency transit assistance.",
            category = "police",
            badge = "Highway Help",
            icon = "🚔"
        ),
        EmergencyContact(
            name = "Sukraraj Tropical Infectious Disease Hotline",
            nameNp = "शुक्रराज ट्रपिकल तथा सरुवा रोग",
            number = "1115",
            desc = "Ministry of Health epidemic, dengue, rabies, and snakebite clinical guidance.",
            category = "national-helpline",
            badge = "Infectious Disease",
            icon = "🧪"
        ),
        EmergencyContact(
            name = "National Mental Health Suicide Prevention Helpline",
            nameNp = "राष्ट्रिय मानसिक स्वास्थ्य सहायता",
            number = "1166",
            desc = "24/7 Confidential mental health crisis counseling and emotional support.",
            category = "mental-health",
            badge = "Counseling 24/7",
            icon = "🧠"
        )
    )

    private suspend fun seedDatabaseIfEmpty() {
        val existingDocs = doctorDao.getAllDoctors().first()
        if (existingDocs.isEmpty()) {
            doctorDao.insertDoctors(INITIAL_DOCTORS_SEED)
        }

        val existingHosps = hospitalDao.getAllHospitals().first()
        if (existingHosps.isEmpty()) {
            hospitalDao.insertHospitals(INITIAL_HOSPITALS_SEED)
        }

        val existingApts = appointmentDao.getAllAppointments().first()
        if (existingApts.isEmpty()) {
            appointmentDao.insertAppointments(INITIAL_APPOINTMENTS_SEED)
        }

        val existingRx = prescriptionDao.getAllPrescriptions().first()
        if (existingRx.isEmpty()) {
            prescriptionDao.insertPrescriptions(INITIAL_PRESCRIPTIONS_SEED)
        }
    }

    companion object {
        val INITIAL_DOCTORS_SEED = listOf(
            Doctor(
                id = "doc_002",
                name = "Dr. Sita Adhikari",
                nmcNumber = "NMC-6789",
                specialty = "Gynecology & Obstetrics",
                specialtyNp = "स्त्री तथा प्रसूतिरोग (Gynecology)",
                hospitalId = "hosp_006",
                hospital = "Patan Hospital",
                degrees = "MBBS, MS (Obs/Gynae), Fellowship Reprod.",
                experienceYears = 11,
                feeNpr = 900,
                available = true,
                rating = 4.8,
                reviewsCount = 112,
                languages = "Nepali, English, Newari",
                schedule = "Mon - Fri (09:00 AM - 03:00 PM)"
            ),
            Doctor(
                id = "doc_003",
                name = "Dr. Bibek Thapa",
                nmcNumber = "NMC-8821",
                specialty = "Orthopedics & Spine Surgery",
                specialtyNp = "हाडजोर्नी तथा नशा (Orthopedics)",
                hospitalId = "hosp_004",
                hospital = "Om Hospital & Research Centre",
                degrees = "MBBS, MS (Ortho), MCh Spine",
                experienceYears = 16,
                feeNpr = 1100,
                available = true,
                rating = 4.7,
                reviewsCount = 96,
                languages = "Nepali, English",
                schedule = "Sun, Tue, Thu (11:00 AM - 05:00 PM)"
            ),
            Doctor(
                id = "doc_004",
                name = "Dr. Priya Karki",
                nmcNumber = "NMC-9943",
                specialty = "Pediatrics & Child Health",
                specialtyNp = "बालरोग (Pediatrics)",
                hospitalId = "hosp_014",
                hospital = "Kanti Children's Hospital",
                degrees = "MBBS, MD (Pediatrics)",
                experienceYears = 9,
                feeNpr = 750,
                available = true,
                rating = 4.9,
                reviewsCount = 130,
                languages = "Nepali, English, Maithili",
                schedule = "Sun - Fri (08:30 AM - 02:30 PM)"
            ),
            Doctor(
                id = "doc_005",
                name = "Dr. Anup Regmi",
                nmcNumber = "NMC-3310",
                specialty = "Neurology",
                specialtyNp = "नसारोग (Neurology)",
                hospitalId = "hosp_002",
                hospital = "Grande International Hospital",
                degrees = "MBBS, DM (Neurology)",
                experienceYears = 15,
                feeNpr = 1500,
                available = false,
                rating = 4.9,
                reviewsCount = 78,
                languages = "Nepali, English",
                schedule = "Tue, Wed, Fri (12:00 PM - 06:00 PM)"
            ),
            Doctor(
                id = "doc_006",
                name = "Dr. Sunita Maharjan",
                nmcNumber = "NMC-1029",
                specialty = "Dermatology & Venereology",
                specialtyNp = "छाला तथा यौनरोग (Dermatology)",
                hospitalId = "hosp_009",
                hospital = "Blue Cross Hospital",
                degrees = "MBBS, MD (Dermatology)",
                experienceYears = 8,
                feeNpr = 800,
                available = true,
                rating = 4.6,
                reviewsCount = 65,
                languages = "Nepali, English, Newari",
                schedule = "Sun - Thu (10:00 AM - 04:00 PM)"
            ),
            Doctor(
                id = "doc_007",
                name = "Dr. Deepak Pant",
                nmcNumber = "NMC-5542",
                specialty = "General Medicine & Diabetology",
                specialtyNp = "सामान्य चिकित्सा (General Medicine)",
                hospitalId = "hosp_005",
                hospital = "Bir Hospital",
                degrees = "MBBS, MD (Internal Medicine)",
                experienceYears = 18,
                feeNpr = 500,
                available = true,
                rating = 4.5,
                reviewsCount = 180,
                languages = "Nepali, English, Hindi",
                schedule = "Sun - Fri (09:00 AM - 02:00 PM)"
            ),
            Doctor(
                id = "doc_008",
                name = "Dr. Rabina Gurung",
                nmcNumber = "NMC-7128",
                specialty = "Psychiatry & Mental Health",
                specialtyNp = "मानसिक रोग (Psychiatry)",
                hospitalId = "hosp_010",
                hospital = "Nepal Medical College (NMC)",
                degrees = "MBBS, MD (Psychiatry)",
                experienceYears = 10,
                feeNpr = 1000,
                available = true,
                rating = 4.8,
                reviewsCount = 89,
                languages = "Nepali, English, Gurung",
                schedule = "Mon - Thu (11:00 AM - 05:00 PM)"
            ),
            Doctor(
                id = "doc_009",
                name = "Dr. Roshan Shrestha",
                nmcNumber = "NMC-4921",
                specialty = "Gastroenterology",
                specialtyNp = "पेट तथा कलेजो रोग (Gastroenterology)",
                hospitalId = "hosp_011",
                hospital = "HAMS Hospital",
                degrees = "MBBS, MD, DM (Gastroenterology)",
                experienceYears = 13,
                feeNpr = 1300,
                available = true,
                rating = 4.7,
                reviewsCount = 55,
                languages = "Nepali, English",
                schedule = "Sun, Mon, Wed, Fri (10:00 AM - 04:00 PM)"
            ),
            Doctor(
                id = "doc_010",
                name = "Dr. Manisha Shrestha",
                nmcNumber = "NMC-8302",
                specialty = "ENT & Head Neck Surgery",
                specialtyNp = "नाक कान घाँटी (ENT)",
                hospitalId = "hosp_003",
                hospital = "Kathmandu Medical College (KMC)",
                degrees = "MBBS, MS (ENT)",
                experienceYears = 12,
                feeNpr = 850,
                available = true,
                rating = 4.6,
                reviewsCount = 72,
                languages = "Nepali, English",
                schedule = "Sun - Thu (09:30 AM - 03:30 PM)"
            ),
            Doctor(
                id = "doc_011",
                name = "Dr. Prajwal Bhattarai",
                nmcNumber = "NMC-9204",
                specialty = "Pulmonology & Chest Diseases",
                specialtyNp = "छाती तथा श्वासप्रश्वास (Pulmonology)",
                hospitalId = "hosp_013",
                hospital = "TU Teaching Hospital (TUTH)",
                degrees = "MBBS, MD (Pulmonology)",
                experienceYears = 14,
                feeNpr = 700,
                available = true,
                rating = 4.8,
                reviewsCount = 91,
                languages = "Nepali, English",
                schedule = "Sun - Fri (08:00 AM - 01:00 PM)"
            ),
            Doctor(
                id = "doc_012",
                name = "Dr. Saroj Koirala",
                nmcNumber = "NMC-6119",
                specialty = "Urology & Renal Transplant",
                specialtyNp = "मृगौला तथा मूत्ररोग (Urology)",
                hospitalId = "hosp_012",
                hospital = "Nepal Mediciti Hospital",
                degrees = "MBBS, MS, MCh (Urology)",
                experienceYears = 17,
                feeNpr = 1600,
                available = false,
                rating = 4.9,
                reviewsCount = 104,
                languages = "Nepali, English, Bhojpuri",
                schedule = "Tue, Thu, Sat (01:00 PM - 06:00 PM)"
            ),
            Doctor(
                id = "doc_013",
                name = "Dr. Sabina Tuladhar",
                nmcNumber = "NMC-3891",
                specialty = "Ophthalmology (Eye Care)",
                specialtyNp = "आँखा रोग (Ophthalmology)",
                hospitalId = "hosp_008",
                hospital = "Civil Service Hospital",
                degrees = "MBBS, MD (Ophthalmology)",
                experienceYears = 10,
                feeNpr = 600,
                available = true,
                rating = 4.7,
                reviewsCount = 68,
                languages = "Nepali, English, Newari",
                schedule = "Sun - Thu (10:00 AM - 04:00 PM)"
            ),
            Doctor(
                id = "doc_014",
                name = "Dr. Hemant Gautam",
                nmcNumber = "NMC-4402",
                specialty = "Oncology & Cancer Care",
                specialtyNp = "क्यान्सर रोग (Oncology)",
                hospitalId = "hosp_002",
                hospital = "Grande International Hospital",
                degrees = "MBBS, MD, DM (Medical Oncology)",
                experienceYears = 16,
                feeNpr = 1800,
                available = true,
                rating = 4.9,
                reviewsCount = 82,
                languages = "Nepali, English, Hindi",
                schedule = "Mon, Wed, Fri (11:00 AM - 05:00 PM)"
            ),
            Doctor(
                id = "doc_015",
                name = "Dr. Laxmi Subedi",
                nmcNumber = "NMC-5874",
                specialty = "Endocrinology & Thyroid",
                specialtyNp = "हर्मोन तथा थाइराइड (Endocrinology)",
                hospitalId = "hosp_007",
                hospital = "Manipal Teaching Hospital",
                degrees = "MBBS, MD (Endocrinology)",
                experienceYears = 12,
                feeNpr = 950,
                available = true,
                rating = 4.8,
                reviewsCount = 75,
                languages = "Nepali, English",
                schedule = "Sun - Fri (09:00 AM - 03:00 PM)"
            ),
            Doctor(
                id = "doc_016",
                name = "Dr. Niraj Bajracharya",
                nmcNumber = "NMC-7650",
                specialty = "Nephrology & Dialysis",
                specialtyNp = "मिर्गौलारोग (Nephrology)",
                hospitalId = "hosp_015",
                hospital = "National Academy Medical Sciences (NAMS)",
                degrees = "MBBS, MD, DM (Nephrology)",
                experienceYears = 15,
                feeNpr = 800,
                available = true,
                rating = 4.6,
                reviewsCount = 59,
                languages = "Nepali, English, Newari",
                schedule = "Sun - Thu (09:00 AM - 02:00 PM)"
            )
        )

        val INITIAL_HOSPITALS_SEED = listOf(
            Hospital(
                id = "hosp_001",
                name = "Norvic International Hospital",
                nameNp = "नर्भिक इन्टरनेशनल हस्पिटल",
                address = "Thapathali, Kathmandu",
                district = "Kathmandu",
                phone = "+977-01-4258554",
                emergency = "+977-01-4258555",
                email = "info@norvichospital.com",
                type = "Private",
                beds = 150,
                icu = true,
                specialties = "Cardiology, Neurology, Orthopedics, Oncology",
                open247 = true,
                rating = 4.7,
                description = "Leading multi-specialty hospital with state-of-the-art cardiac and neuro care."
            ),
            Hospital(
                id = "hosp_002",
                name = "Grande International Hospital",
                nameNp = "ग्रान्डी इन्टरनेशनल हस्पिटल",
                address = "Dhapasi, Kathmandu",
                district = "Kathmandu",
                phone = "+977-01-5159266",
                emergency = "+977-01-5159267",
                email = "info@grandehospital.com.np",
                type = "Private",
                beds = 300,
                icu = true,
                specialties = "Cardiology, Neurosurgery, Oncology, Pediatrics, Transplant",
                open247 = true,
                rating = 4.8,
                description = "Nepal's premier quaternary care hospital with international transplant protocols."
            ),
            Hospital(
                id = "hosp_003",
                name = "Kathmandu Medical College (KMC)",
                nameNp = "काठमाडौं मेडिकल कलेज",
                address = "Sinamangal, Kathmandu",
                district = "Kathmandu",
                phone = "+977-01-4467557",
                emergency = "+977-01-4467558",
                email = "info@kmc.edu.np",
                type = "Teaching",
                beds = 400,
                icu = true,
                specialties = "General Medicine, Surgery, Gynecology, Pediatrics, Radiology",
                open247 = true,
                rating = 4.4,
                description = "Academic hospital offering affordable comprehensive diagnostics."
            ),
            Hospital(
                id = "hosp_004",
                name = "Om Hospital & Research Centre",
                nameNp = "ओम हस्पिटल एण्ड रिसर्च सेन्टर",
                address = "Chabahil, Kathmandu",
                district = "Kathmandu",
                phone = "+977-01-4476270",
                emergency = "+977-01-4476271",
                email = "om@omhospitalnepal.com",
                type = "Private",
                beds = 175,
                icu = true,
                specialties = "Gynecology, Orthopedics, Urology, Nephrology, IVF",
                open247 = true,
                rating = 4.5,
                description = "Renowned for reproductive medicine, IVF, and orthopedic surgery."
            ),
            Hospital(
                id = "hosp_005",
                name = "Bir Hospital (Trauma Centre)",
                nameNp = "वीर अस्पताल तथा राष्ट्रिय ट्रमा सेन्टर",
                address = "Kanti Path, Kathmandu",
                district = "Kathmandu",
                phone = "+977-01-4221119",
                emergency = "+977-01-4221988",
                email = "info@birhospital.gov.np",
                type = "Government",
                beds = 460,
                icu = true,
                specialties = "Trauma Surgery, Orthopedics, Neurosurgery, Burn Unit",
                open247 = true,
                rating = 4.3,
                description = "Nepal's oldest and primary national central government trauma referral hospital."
            ),
            Hospital(
                id = "hosp_006",
                name = "Patan Hospital",
                nameNp = "पाटन अस्पताल",
                address = "Lagankhel, Lalitpur",
                district = "Lalitpur",
                phone = "+977-01-5522278",
                emergency = "+977-01-5522266",
                email = "patan@patanhospital.org.np",
                type = "Non-Profit",
                beds = 450,
                icu = true,
                specialties = "Internal Medicine, Pediatrics, Obs/Gynae, Emergency, Snakebite",
                open247 = true,
                rating = 4.6,
                description = "Non-profit charitable institution famous for compassionate holistic treatment."
            ),
            Hospital(
                id = "hosp_007",
                name = "Manipal Teaching Hospital",
                nameNp = "मनिपाल शिक्षण अस्पताल",
                address = "Phulbari, Pokhara",
                district = "Kaski",
                phone = "+977-061-526416",
                emergency = "+977-061-526417",
                email = "info@manipal.edu.np",
                type = "Teaching",
                beds = 750,
                icu = true,
                specialties = "Cardiology, Neurology, Emergency Trauma, Gastro, Oncology",
                open247 = true,
                rating = 4.7,
                description = "Western Nepal's flagship quaternary care facility in Pokhara."
            ),
            Hospital(
                id = "hosp_014",
                name = "Kanti Children's Hospital",
                nameNp = "कान्ति बाल अस्पताल",
                address = "Maharajgunj, Kathmandu",
                district = "Kathmandu",
                phone = "+977-01-4412798",
                emergency = "+977-01-4412799",
                email = "info@kantichildren.org.np",
                type = "Government",
                beds = 310,
                icu = true,
                specialties = "Pediatrics, Neonatology, Child Surgery, Child Neurology",
                open247 = true,
                rating = 4.3,
                description = "Nepal's premier pediatric specialty hospital."
            )
        )

        val INITIAL_APPOINTMENTS_SEED = listOf(
            Appointment(
                id = "apt_003",
                patientUsername = "patient_nepal",
                patientName = "Nepal Parajuli",
                doctorId = "doc_002",
                doctorName = "Dr. Sita Adhikari",
                specialty = "Gynecology & Obstetrics",
                hospital = "Patan Hospital",
                date = "2026-09-22",
                time = "11:00 AM",
                type = "Video Consultation",
                status = "Confirmed",
                symptoms = "Routine seasonal health review & preventive consultation.",
                feeNpr = 900,
                meetingLink = "https://telemednepal.org.np/room/nep-v2-apt003"
            )
        )

        val INITIAL_PRESCRIPTIONS_SEED = listOf(
            Prescription(
                id = "rx_002",
                appointmentId = "apt_003",
                patientUsername = "patient_nepal",
                patientName = "Nepal Parajuli",
                doctorId = "doc_002",
                doctorName = "Dr. Sita Adhikari",
                specialty = "Gynecology & Obstetrics",
                date = "2026-08-20",
                diagnosis = "Routine Preventive Health Check",
                bp = "120/80 mmHg",
                pulse = "76 bpm",
                weightKg = 68,
                spO2 = "98%",
                medicinesSummary = "Ferrous Ascorbate + Folic Acid (100mg / 1.5mg, Once daily post lunch, 30 days) | Vitamin C 500mg (Once daily, 15 days)",
                lifestyleAdvice = "Maintain balanced diet rich in leafy greens. Drink 2.5 - 3 liters boiled water daily. Wear mask in dusty areas.",
                followUpDate = "2026-09-22"
            )
        )
    }
}
