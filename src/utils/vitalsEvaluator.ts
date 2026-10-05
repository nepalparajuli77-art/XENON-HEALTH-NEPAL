/**
 * Clinical Vitals Evaluator & Diagnostic Classification Engine
 * Based on AHA, WHO, and Nepal Health Research Council (NHRC) Guidelines
 */

export interface VitalsEvaluation {
  status: 'normal' | 'warning' | 'critical' | 'low';
  label: string;
  labelNp: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  descriptionNp: string;
}

// 1. Blood Pressure Evaluator
export function evaluateBloodPressure(systolic: number, diastolic: number): VitalsEvaluation {
  if (systolic >= 180 || diastolic >= 120) {
    return {
      status: 'critical',
      label: 'Hypertensive Crisis',
      labelNp: 'अत्यधिक उच्च रक्तचाप (Crisis)',
      badgeBg: 'bg-red-500/15 border-red-500/30',
      badgeText: 'text-red-700 dark:text-red-400',
      description: 'Emergency clinical attention required. Risk of organ damage.',
      descriptionNp: 'तत्काल आकस्मिक चिकित्सकीय सहयोग आवश्यक छ।'
    };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return {
      status: 'warning',
      label: 'Stage 2 Hypertension',
      labelNp: 'उच्च रक्तचाप (Stage 2)',
      badgeBg: 'bg-amber-500/15 border-amber-500/30',
      badgeText: 'text-amber-700 dark:text-amber-400',
      description: 'Substantially elevated. Consult prescribing physician for Rx adjustment.',
      descriptionNp: 'रक्तचाप उच्च छ। डाक्टरसँग परामर्श गरी औषधि समायोजन गर्नुहोस्।'
    };
  }
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return {
      status: 'warning',
      label: 'Stage 1 Hypertension',
      labelNp: 'सामान्यभन्दा बढी (Stage 1)',
      badgeBg: 'bg-amber-500/10 border-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-300',
      description: 'Lifestyle modification, sodium restriction, and monitoring recommended.',
      descriptionNp: 'नुनको मात्रा घटाउने, नियमित व्यायाम र अनुगमन सिफारिस गरिन्छ।'
    };
  }
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
    return {
      status: 'normal',
      label: 'Elevated BP',
      labelNp: 'हल्का बढी (Elevated)',
      badgeBg: 'bg-blue-500/10 border-blue-500/20',
      badgeText: 'text-blue-700 dark:text-blue-300',
      description: 'Borderline range. Healthy diet and hydration advised.',
      descriptionNp: 'स्वस्थ खानपान र दैनिक हिँडडुल जारी राख्नुहोस्।'
    };
  }
  if (systolic < 90 || diastolic < 60) {
    return {
      status: 'low',
      label: 'Hypotension (Low BP)',
      labelNp: 'कम रक्तचाप (Hypotension)',
      badgeBg: 'bg-purple-500/10 border-purple-500/20',
      badgeText: 'text-purple-700 dark:text-purple-300',
      description: 'Low blood pressure. Ensure hydration and oral rehydration fluids (Jeevan Jal).',
      descriptionNp: 'रक्तचाप कम छ। जीवनजल र प्रशस्त झोलिलो पदार्थ पिउनुहोस्।'
    };
  }
  return {
    status: 'normal',
    label: 'Normal (Optimal)',
    labelNp: 'सामान्य (Optimal)',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    description: 'Optimal cardiovascular blood pressure zone (<120/<80 mmHg).',
    descriptionNp: 'रक्तचाप पूर्णतया सामान्य र स्वस्थ अवस्थामा छ।'
  };
}

// 2. Pulse / Heart Rate Evaluator
export function evaluateHeartRate(bpm: number): VitalsEvaluation {
  if (bpm > 120) {
    return {
      status: 'critical',
      label: 'Severe Tachycardia',
      labelNp: 'अत्यधिक द्रुत मुटुको चाल (High)',
      badgeBg: 'bg-red-500/15 border-red-500/30',
      badgeText: 'text-red-700 dark:text-red-400',
      description: 'Elevated resting pulse. Check for fever, dehydration, or arrhythmia.',
      descriptionNp: 'मुटुको चाल अत्यधिक छ। आराम गर्नुहोस् र आवश्यक परे जाँच गराउनुहोस्।'
    };
  }
  if (bpm > 100) {
    return {
      status: 'warning',
      label: 'Mild Tachycardia',
      labelNp: 'सामान्यभन्दा छिटो चाल',
      badgeBg: 'bg-amber-500/10 border-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-300',
      description: 'Resting pulse is elevated above 100 bpm.',
      descriptionNp: 'मुटुको चाल १०० भन्दा माथि छ।'
    };
  }
  if (bpm < 50) {
    return {
      status: 'warning',
      label: 'Bradycardia (Low Pulse)',
      labelNp: 'कम मुटुको चाल (Bradycardia)',
      badgeBg: 'bg-purple-500/10 border-purple-500/20',
      badgeText: 'text-purple-700 dark:text-purple-300',
      description: 'Below 50 bpm (unless highly conditioned athlete).',
      descriptionNp: 'मुटुको चाल सुस्त छ (खेलाडीबाहेक सतर्कता आवश्यक)।'
    };
  }
  return {
    status: 'normal',
    label: 'Resting Normal',
    labelNp: 'सामान्य चाल (60-100)',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    description: 'Optimal resting heart rate zone (60-100 bpm).',
    descriptionNp: 'मुटुको चाल सामान्य दायराभित्र छ।'
  };
}

// 3. SpO2 Blood Oxygen Evaluator
export function evaluateSpO2(spO2: number, altitudeMeters = 1400): VitalsEvaluation {
  if (spO2 < 85) {
    return {
      status: 'critical',
      label: 'Severe Hypoxemia (Critical)',
      labelNp: 'अक्सिजनको गम्भीर कमी (Critical)',
      badgeBg: 'bg-red-500/15 border-red-500/30',
      badgeText: 'text-red-700 dark:text-red-400',
      description: 'Dangerous hypoxemia. Administer supplemental oxygen and descend immediately.',
      descriptionNp: 'रगतमा अक्सिजनको मात्रा खतरनाक रूपमा कम छ। तत्काल अक्सिजन दिनुहोस्।'
    };
  }
  if (spO2 < 90) {
    return {
      status: 'warning',
      label: 'Moderate Hypoxia',
      labelNp: 'अक्सिजनको कमी (Hypoxia)',
      badgeBg: 'bg-amber-500/15 border-amber-500/30',
      badgeText: 'text-amber-700 dark:text-amber-400',
      description: 'SpO2 below 90%. Rest, deep breathing, and medical evaluation required.',
      descriptionNp: 'अक्सिजन ९०% भन्दा कम छ। आराम गरी गहिरो श्वास लिनुहोस्।'
    };
  }
  if (spO2 < 95) {
    const isHighAltitude = altitudeMeters >= 2500;
    return {
      status: isHighAltitude ? 'normal' : 'warning',
      label: isHighAltitude ? 'Acclimatizing (High Altitude)' : 'Borderline Low',
      labelNp: isHighAltitude ? 'उचाइ अनुकूलन (Acclimatizing)' : 'सामान्यभन्दा केही कम',
      badgeBg: isHighAltitude ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-amber-500/10 border-amber-500/20',
      badgeText: isHighAltitude ? 'text-cyan-700 dark:text-cyan-300' : 'text-amber-700 dark:text-amber-300',
      description: isHighAltitude
        ? 'Typical oxygen adaptation at high altitude (>2,500m).'
        : 'Slightly lower than valley baseline (95-100%).',
      descriptionNp: isHighAltitude
        ? 'उच्च हिमाली उचाइमा शरीर अनुकूलन भइरहेको सामान्य लक्षण।'
        : 'उपत्यकाको सामान्य स्तरभन्दा अलि कम।'
    };
  }
  return {
    status: 'normal',
    label: 'Optimal Oxygenation',
    labelNp: 'उत्कृष्ट अक्सिजन स्तर (95-100%)',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    description: 'Healthy oxygen saturation range (95-100%).',
    descriptionNp: 'रगतमा अक्सिजनको स्तर पूर्णतया स्वस्थ छ।'
  };
}

// 4. Blood Glucose Evaluator
export function evaluateGlucose(mgDl: number): VitalsEvaluation {
  if (mgDl < 70) {
    return {
      status: 'critical',
      label: 'Hypoglycemia (Low Sugar)',
      labelNp: 'कम ग्लुकोज (Hypoglycemia)',
      badgeBg: 'bg-red-500/15 border-red-500/30',
      badgeText: 'text-red-700 dark:text-red-400',
      description: 'Low blood sugar. Consume fast-acting carbs (juice, glucose, candy) immediately.',
      descriptionNp: 'ग्लुकोज कम छ। तत्काल चिनी, जुस वा ग्लुकोज पानी पिउनुहोस्।'
    };
  }
  if (mgDl >= 180) {
    return {
      status: 'critical',
      label: 'Hyperglycemia (High Sugar)',
      labelNp: 'उच्च ग्लुकोज (Hyperglycemia)',
      badgeBg: 'bg-red-500/15 border-red-500/30',
      badgeText: 'text-red-700 dark:text-red-400',
      description: 'Significantly elevated blood sugar. Consult diabetologist / physician.',
      descriptionNp: 'रगतमा चिनीको मात्रा धेरै छ। डाक्टरसँग परामर्श लिनुहोस्।'
    };
  }
  if (mgDl >= 126) {
    return {
      status: 'warning',
      label: 'Diabetic Range',
      labelNp: 'मधुमेह दायरा (Diabetic)',
      badgeBg: 'bg-amber-500/15 border-amber-500/30',
      badgeText: 'text-amber-700 dark:text-amber-400',
      description: 'Elevated fasting blood sugar.',
      descriptionNp: 'रगतमा चिनीको स्तर बढेको छ।'
    };
  }
  if (mgDl >= 100) {
    return {
      status: 'warning',
      label: 'Pre-Diabetic Range',
      labelNp: 'प्रि-डायबिटीज दायरा',
      badgeBg: 'bg-amber-500/10 border-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-300',
      description: 'Borderline fasting sugar. Exercise and diet adjustment recommended.',
      descriptionNp: 'खानपान नियन्त्रण र दैनिक हिँडडुल आवश्यक छ।'
    };
  }
  return {
    status: 'normal',
    label: 'Normal Fasting (70-99)',
    labelNp: 'सामान्य (70-99 mg/dL)',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    description: 'Optimal fasting blood glucose zone.',
    descriptionNp: 'रगतमा चिनीको मात्रा सामान्य छ।'
  };
}

// 5. Body Temperature Evaluator
export function evaluateTemperature(degF: number): VitalsEvaluation {
  if (degF > 103.0) {
    return {
      status: 'critical',
      label: 'High Fever (Hyperpyrexia)',
      labelNp: 'उच्च ज्वरो (High Fever)',
      badgeBg: 'bg-red-500/15 border-red-500/30',
      badgeText: 'text-red-700 dark:text-red-400',
      description: 'High fever. Apply cold sponge, Paracetamol, and seek urgent clinical evaluation.',
      descriptionNp: 'अत्यधिक ज्वरो आएको छ। सिटामोल खाने र चिसो पानीपट्टी लगाउने गर्नुहोस्।'
    };
  }
  if (degF >= 100.4) {
    return {
      status: 'warning',
      label: 'Fever (Pyrexia)',
      labelNp: 'ज्वरो (Fever)',
      badgeBg: 'bg-amber-500/15 border-amber-500/30',
      badgeText: 'text-amber-700 dark:text-amber-400',
      description: 'Febrile state (>100.4 °F). Hydrate and monitor symptoms.',
      descriptionNp: 'शरीरको तापक्रम बढेको छ। प्रशस्त पानी पिउनुहोस्।'
    };
  }
  if (degF >= 99.1) {
    return {
      status: 'normal',
      label: 'Low-Grade Warmth',
      labelNp: 'हल्का तातो (99.1-100.3)',
      badgeBg: 'bg-amber-500/10 border-amber-500/20',
      badgeText: 'text-amber-700 dark:text-amber-300',
      description: 'Mild temperature variation.',
      descriptionNp: 'सामान्यभन्दा हल्का तातो।'
    };
  }
  if (degF < 95.0) {
    return {
      status: 'critical',
      label: 'Hypothermia',
      labelNp: 'अत्यधिक चिसो (Hypothermia)',
      badgeBg: 'bg-blue-500/15 border-blue-500/30',
      badgeText: 'text-blue-700 dark:text-blue-400',
      description: 'Body temperature is dangerously low. Warm fluids and insulated shelter needed.',
      descriptionNp: 'शरीर अत्यधिक चिसो भएको छ। तातो लुगा र मनतातो झोल खानुहोस्।'
    };
  }
  return {
    status: 'normal',
    label: 'Afebrile (Normal)',
    labelNp: 'सामान्य (97-99 °F)',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    description: 'Normal resting core body temperature.',
    descriptionNp: 'शरीरको तापक्रम सामान्य छ।'
  };
}
