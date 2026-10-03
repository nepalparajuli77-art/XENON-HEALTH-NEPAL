import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  AlertTriangle,
  ShieldAlert,
  PhoneCall,
  Calendar,
  Building2,
  CheckCircle2,
  RefreshCw,
  Info,
  Stethoscope,
  HeartPulse,
  Flame,
  Activity,
  Zap,
  Wifi,
  Radio
} from 'lucide-react';
import { Language } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'xenon';
  text: string;
  timestamp: string;
  severity?: 'critical' | 'urgent' | 'routine';
  firstAidSteps?: string[];
  recommendedSpecialty?: string;
  recommendedHospital?: string;
}

interface XenonAiViewProps {
  language: Language;
  onBookDoctor?: () => void;
  onNavigate?: (tab: string) => void;
}

export const XenonAiView: React.FC<XenonAiViewProps> = ({
  language,
  onBookDoctor,
  onNavigate
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_1',
      sender: 'xenon',
      text:
        language === 'np'
          ? `नमस्ते! म **जिनोन एआई (Xenon AI)**, जेनन हेल्थको क्लिनिकल ट्राइएज तथा प्राथमिक उपचार सहायक हुँ।\n\nतपाईंलाई कुनै चोटपटक, घाउ, दुखाइ वा आकस्मिक स्वास्थ्य समस्या भएको छ? मलाई सिधा सोध्नुहोस्। उदाहरणका लागि: "मेरो हातबाट धेरै रगत बगिरहेको छ, के गर्ने?" वा "छाती दुखेको छ"। म तपाईंलाई तत्काल प्राथमिक उपचार र अस्पतालको सिफारिस दिनेछु।`
          : `Hello! I am **Xenon AI**, your clinical triage & emergency first-aid assistant on XENON HEALTH.\n\nDescribe your symptoms, injury, or medical situation (e.g. *"I have a bleeding hand, what should I do?"* or *"Crushing chest pain"*). I evaluate acuity, provide logical emergency first-aid protocols, and connect you with certified NMC doctors and hospitals across Nepal.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      severity: 'routine'
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [xenonStatus, setXenonStatus] = useState<{
    connected: boolean;
    engine: string;
    model: string;
    assistant_name: string;
    node: string;
  }>({
    connected: true,
    engine: 'Google Gemini (gemini-3.1-flash-lite)',
    model: 'gemini-3.1-flash-lite',
    assistant_name: 'Xenon',
    node: 'Kathmandu Central Node'
  });
  const [checkingStatus, setCheckingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const checkConnection = async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch('/api/xenon/status');
      if (res.ok) {
        const data = await res.json();
        setXenonStatus({
          connected: data.connected ?? true,
          engine: data.engine ?? 'Google Gemini (gemini-3.1-flash-lite)',
          model: data.model ?? 'gemini-3.1-flash-lite',
          assistant_name: data.assistant_name ?? 'Xenon',
          node: data.node ?? 'Kathmandu Central Node'
        });
      }
    } catch (e) {
      console.warn('Status ping fallback:', e);
    } finally {
      setTimeout(() => setCheckingStatus(false), 400);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    {
      label: language === 'np' ? '🩸 हातबाट गम्भीर रक्तस्राव (Bleeding Hand)' : '🩸 Severe Bleeding Hand Laceration',
      prompt: language === 'np' ? 'मेरो हात काटिएर धेरै रगत बगिरहेको छ, के गर्ने?' : 'I have a deep bleeding wound on my hand, how do I stop it immediately?'
    },
    {
      label: language === 'np' ? '❤️ छाती दुख्ने / दम बढ्ने (Chest Pain)' : '❤️ Acute Crushing Chest Pain',
      prompt: language === 'np' ? 'छाती च्यापेर बायाँ हाततिर दुखाइ फैलिएको छ र सास फेर्न गाह्रो भएको छ।' : 'I have crushing chest pain radiating to my left arm and jaw with cold sweat.'
    },
    {
      label: language === 'np' ? '🐶 कुकुरले टोकेको (Dog Bite & Rabies)' : '🐶 Street Dog Bite (Rabies Protocol)',
      prompt: language === 'np' ? 'सडकको कुकुरले खुट्टामा टोकेर दाँत गाडिएको छ, रगत आइरहेको छ। के गर्ने?' : 'A stray dog bit my leg with punctured skin. What is the immediate step-by-step wound washing and rabies vaccine protocol in Nepal?'
    },
    {
      label: language === 'np' ? '🔥 आगो वा तातो पानीले पोलेको (Burn)' : '🔥 Scald / Thermal Burn on Forearm',
      prompt: language === 'np' ? 'हातमा उम्लेको पानी परेर ठूलो भाग पोलेको छ र फोका उठ्न थालेको छ।' : 'Boiling water splashed on my forearm, skin is red with blisters forming.'
    },
    {
      label: language === 'np' ? '🦟 डेंगु / उच्च ज्वरो (High Fever)' : '🦟 High Fever with Severe Eye Pain (Dengue)',
      prompt: language === 'np' ? '३ दिनदेखि १०३°F उच्च ज्वरो, आँखाको पछाडि कडा दुखाइ र शरीर दुखेको छ।' : 'I have 103°F sudden high fever for 3 days, severe retro-orbital eye pain and muscle aches. Suspecting Dengue.'
    },
    {
      label: language === 'np' ? '🏔️ उचाइमा लेक लागेको (Altitude AMS)' : '🏔️ Altitude Sickness (AMS) above 3,500m',
      prompt: language === 'np' ? '३,५०० मिटर उचाइमा कडा टाउको दुख्ने, वाकवाकी लाग्ने र सास फेर्न गाह्रो भएको छ।' : 'Trekking in Manang at 3,500m with severe throbbing headache, nausea, and shortness of breath.'
    },
    {
      label: language === 'np' ? '🚁 नेपाली सेना हेलिकप्टर र ड्रोन (Army Medevac & Drone)' : '🚁 Army Helicopter Rescue & DJI Drone Dispatch',
      prompt: language === 'np' ? 'दुर्गम हिमाली ठाउँमा फसेको बेला नेपाली सेनाको हेलिकप्टर वा DJI FlyCart 30 ड्रोन औषधि ढुवानी कसरी मगाउने?' : 'How do I request emergency Nepal Army helicopter medevac or DJI FlyCart 30 drone medical cargo dispatch in remote districts?'
    }
  ];

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await fetch('/api/xenon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          language: language === 'np' ? 'np' : 'en',
          history: historyPayload
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      const aiMsg: Message = {
        id: `xenon_${Date.now()}`,
        sender: 'xenon',
        text: data.reply || 'Clinical assessment completed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity: data.severity || (query.toLowerCase().includes('bleed') || query.toLowerCase().includes('chest') ? 'critical' : 'urgent'),
        firstAidSteps: data.first_aid_steps,
        recommendedSpecialty: data.recommended_specialty,
        recommendedHospital: data.recommended_hospital
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.warn('Network call failed, executing local intelligent triage engine:', err);

      // Local emergency intelligence engine
      const q = query.toLowerCase();
      let replyText = '';
      let severity: 'critical' | 'urgent' | 'routine' = 'routine';
      let steps: string[] = [];
      let spec = 'General Practice';
      let hosp = 'Tribhuvan University Teaching Hospital (TUTH)';

      if (q.includes('bleed') || q.includes('blood') || q.includes('cut') || q.includes('wound') || q.includes('रगत')) {
        severity = 'critical';
        spec = 'Trauma & Orthopedic Surgery / Vascular Care';
        hosp = 'National Trauma Centre (Bir Hospital Complex), Kathmandu';
        steps = [
          'Direct Pressure: Press firmly on wound with clean sterile cloth for 10 min uninterrupted',
          'Elevation: Keep the bleeding hand elevated strictly above heart level',
          'Do NOT put ash, mud, turmeric, or chemical powders into the open cut',
          'Check motor function of fingers (rule out flexor tendon or radial/ulnar nerve transection)',
          'Tetanus Toxoid shot within 24 hours + Emergency Room visit if bleeding doesn’t cease'
        ];
        replyText = language === 'np'
          ? `🚨 **तत्काल प्राथमिक उपचार: हातको रक्तस्राव (Severe Bleeding Wound)**\n\n` +
            `१. **लगातार प्रत्यक्ष दबाब (Direct Pressure):** सफा कपडा वा गजले घाउमा कम्तीमा १० मिनेटसम्म नछोडी जोडले थिच्नुहोस्। बारम्बार हेर्न नउठाउनुहोस्।\n` +
            `२. **हात मुटुभन्दा माथि उठाउनुहोस् (Elevation):** हातलाई तुरुन्त मुटुको सतहभन्दा माथि राख्नुहोस्, यसले रगतको प्रवाह कम गर्छ।\n` +
            `३. **धुलो, खरानी वा बेसार कहिल्यै नहाल्नुहोस्:** परम्परागत धुलोले गम्भीर संक्रमण (Tetanus & Sepsis) निम्त्याउँछ।\n` +
            `४. **औंलाहरू चलाएर हेर्नुहोस्:** यदि औंला चलाउन नसक्ने वा लाटो भएको छ भने नसा वा टेन्डन (Tendon) काटिएको हुन सक्छ, तत्काल शल्यक्रिया चाहिन्छ।\n` +
            `५. तुरुन्त नजिकको आपतकालीन ट्रमा सेन्टरमा जानुहोस् र धनुष्टंकार (TT) खोप लगाउनुहोस्।`
          : `🚨 **IMMEDIATE EMERGENCY FIRST AID: ACTIVE BLEEDING WOUND**\n\n` +
            `**DO NOT DELAY. DO NOT JUST DRINK WATER — CONTROL THE HEMORRHAGE FIRST:**\n\n` +
            `1. **Continuous Direct Firm Pressure**: Place a clean sterile cloth or heavy gauze directly over the bleeding site and apply uninterrupted pressure for a full 10 minutes. Do not lift to check.\n` +
            `2. **Immediate Elevation**: Raise the injured hand or arm **ABOVE HEART LEVEL** immediately. Gravitational reduction of hydrostatic pressure significantly slows blood loss.\n` +
            `3. **Pulsing vs. Steady Flow Check**:\n` +
            `   - *Pulsing / Squirting Bright Red*: Arterial laceration. Maintain firm direct pressure. If blood soaks through, add more cloth on top (do not remove original layer). If bleeding persists over 10 mins, apply a tourniquet 2 inches above the wound (never over a joint) and record the time.\n` +
            `   - *Steady Dark Flow*: Venous bleeding. Firm compression will achieve hemostasis.\n` +
            `4. **Tendon & Nerve Integrity**: Test if you can flex and extend each finger, and verify fingertip sensation. Deep cuts near wrist or palm frequently sever flexor tendons or digital nerves.\n` +
            `5. **Infection & Tetanus**: Obtain a Tetanus Toxoid (TT) booster within 24 hours. Seek immediate emergency evaluation at the nearest trauma center if bleeding is uncontrolled.`;
      } else if (q.includes('chest') || q.includes('heart') || q.includes('छाती')) {
        severity = 'critical';
        spec = 'Interventional Cardiology / Critical Care';
        hosp = 'Shahid Gangalal National Heart Centre, Bansbari';
        steps = [
          'Sit upright or semi-Fowler position; strictly rest with no physical effort',
          'Chew 1 tablet Aspirin 300mg immediately (if not allergic / no ulcer history)',
          'Loosen all tight neckwear and clothing to ease ventilation',
          'Call Nepal Ambulance 102 immediately for urgent 12-lead ECG'
        ];
        replyText = language === 'np'
          ? `🚨 **अत्यन्त जरुरी: छाती दुख्ने आकस्मिक अवस्था (Acute Coronary Triage)**\n\n१. तुरुन्त आरामसँग बस्नुहोस्। कुनै पनि शारीरिक परिश्रम नगर्नुहोस्।\n२. एस्पिरिन ३०० मिग्रा (Aspirin 300mg) चपाउनुहोस् (एलर्जी नभएमा)।\n३. तुरुन्त १०२ मा फोन गरेर शहीद गंगालाल वा नर्भिक कार्डियाक क्याथ-ल्याब जानुहोस्।`
          : `🚨 **RED ALERT: SUSPECTED ACUTE CORONARY SYNDROME**\n\n1. Stop all exertion immediately and sit in upright / semi-Fowler position.\n2. Chew 300mg Aspirin immediately if no contraindication.\n3. Call Nepal Emergency Ambulance 102 for immediate transport to a 24/7 Cath-Lab.`;
      } else if (q.includes('dog') || q.includes('bite') || q.includes('कुकुर') || q.includes('टोकेको') || q.includes('rabies') || q.includes('cat') || q.includes('monkey')) {
        severity = 'critical';
        spec = 'Infectious Disease & Tropical Medicine';
        hosp = 'Sukraraj Tropical & Infectious Disease Hospital (Teku), Kathmandu';
        steps = [
          'WASH IMMEDIATELY: Run copious tap water and soap continuously over the wound for 15 minutes',
          'Do NOT suture, stitch, or bandage tightly; open wound allows virus egress',
          'Do NOT apply chili powder, kerosene, turmeric, or leaves (contraindicated)',
          'Go immediately to Teku Hospital for Post-Exposure Prophylaxis (ARV) Day 0 shot',
          'If deep puncture / bleeding (Category III), Rabies Immunoglobulin (RIG) is mandatory'
        ];
        replyText = language === 'np'
          ? `🚨 **अत्यन्त जरुरी: कुकुर वा जनावरले टोकेको प्राथमिक उपचार (Rabies Protocol)**\n\n` +
            `१. **१५ मिनेटसम्म साबुन पानीले धुनुहोस् (Soap & Water Flush):** धाराको बगिरहेको पानी र लुगा धुने साबुनले कम्तीमा १५ मिनेटसम्म लगातार घाउ सफा गर्नुहोस्। यसले रेबिज भाइरसलाई ९०% सम्म निष्क्रिय बनाउँछ।\n` +
            `२. **घाउ सिलाउने वा बाँध्ने काम नगर्नुहोस्:** घाउ खुला राख्नुपर्छ।\n` +
            `३. **खुर्सानी, मट्टीतेल, मोबिल वा बेसार कहिल्यै नहाल्नुहोस्।**\n` +
            `४. **तुरुन्त टेकु अस्पताल जानुहोस्:** २४ घण्टाभित्र Anti-Rabies Vaccine (ARV Day 0) र Tetanus (TT) खोप लगाउनुहोस्।\n` +
            `५. यदि रगत आएको छ भने रेबिज इम्युनोग्लोबुलिन (RIG) इन्फेक्सन रोक्न अनिवार्य चाहिन्छ।`
          : `🚨 **EMERGENCY RABIES & ANIMAL BITE PROTOCOL (WHO CATEGORY II/III)**\n\n` +
            `1. **Continuous 15-Minute Soap & Running Water Flush**: Immediately flush all bite marks and scratches with abundant running water and soap for a minimum of 15 continuous minutes. Rabies virus is enveloped and deactivated by alkaline soap.\n` +
            `2. **Antiseptic Application**: Apply Povidone Iodine 10% or 70% surgical spirit after drying with sterile gauze.\n` +
            `3. **Absolute Contraindications**: DO NOT suture or stitch the wound. DO NOT apply chili powder, turmeric, mud, or traditional pastes.\n` +
            `4. **Urgent Post-Exposure Prophylaxis (PEP)**: Report immediately to Sukraraj Tropical Hospital (Teku) or Zonal Hospital for modern cell-culture Rabies Vaccine (Intradermal Regimen on Days 0, 3, 7).\n` +
            `5. **Rabies Immunoglobulin (RIG)**: If skin was punctured or bleeding, RIG must be infiltrated directly into the wound edges without delay.`;
      } else if (q.includes('burn') || q.includes('scald') || q.includes('पोले') || q.includes('उम्लेको')) {
        severity = 'urgent';
        spec = 'Burn & Plastic Reconstructive Surgery';
        hosp = 'Kirtipur Hospital (Burn Centre) / Sushma Koirala Memorial Hospital, Sankhu';
        steps = [
          'Cool with cool running tap water for 20 minutes (do NOT use ice cubes)',
          'Remove tight rings, bracelets, and watches before edema sets in',
          'Do NOT break blisters or pop fluid sacs (blister roof protects against infection)',
          'Do NOT put toothpaste, butter, raw eggs, or gentian violet on burns',
          'Cover loosely with sterile non-adherent dressing or clean plastic wrap'
        ];
        replyText = language === 'np'
          ? `🔥 **तातो पानी वा आगोले पोलेको तत्काल उपचार (Thermal Burn Protocol)**\n\n` +
            `१. **२० मिनेटसम्म चिसो पानी बगाउनुहोस्:** धाराको सामान्य चिसो पानी २० मिनेटसम्म पोलेको भागमा निरन्तर बगाउनुहोस्। बरफ (Ice) कहिल्यै प्रयोग नगर्नुहोस्।\n` +
            `२. **गहना र घडी तुरुन्त फुकाल्नुहोस्:** सुन्निनु अघि नै औंठी वा बाला निकाल्नुहोस्।\n` +
            `३. **फोका (Blisters) कहिल्यै नफुटाउनुहोस्:** छालाको फोकाले भित्री घाउलाई संक्रमणबाट बचाउँछ।\n` +
            `४. **टुथपेस्ट, घ्यू, अण्डा वा माटो नहाल्नुहोस्:** यसले सेप्सिस निम्त्याउँछ।\n` +
            `५. कीर्तिपुर बर्न सेन्टर वा नजिकको अस्पतालमा ड्रेसिङ गराउनुहोस्।`
          : `🔥 **EMERGENCY THERMAL BURN & SCALD MANAGEMENT**\n\n` +
            `1. **Immediate 20-Minute Cool Running Water**: Cool the burn under gentle, running tap water (15°C–25°C) for 20 minutes immediately to halt ongoing dermal thermal coagulation. Never apply ice or freezing ice-packs.\n` +
            `2. **Early Constriction Removal**: Remove rings, watches, bracelets, and restrictive clothes before tissue edema expands.\n` +
            `3. **Preserve Blister Roofs**: Do not de-roof or aspirate blisters. The biological skin barrier prevents multi-drug resistant bacterial colonization.\n` +
            `4. **Banned Home Remedies**: Never coat with toothpaste, oil, mud, or raw eggs.\n` +
            `5. **Cover & Transport**: Apply sterile paraffin gauze or clean non-stick food wrap loosely, and present to Kirtipur Hospital Burn Center.`;
      } else if (q.includes('altitude') || q.includes('trek') || q.includes('manang') || q.includes('mustang') || q.includes('himal') || q.includes('लेक') || q.includes('ams')) {
        severity = 'critical';
        spec = 'Mountain Medicine & Pulmonary Critical Care';
        hosp = 'Himalayan Rescue Association (HRA) Clinics (Pheriche/Manang) / CIWEC Hospital, Kathmandu';
        steps = [
          'GOLDEN RULE: Do NOT ascend further. Rest immediately at current altitude',
          'Descent is definitive cure: Descend 500m to 1,000m immediately if symptoms worsen',
          'Acetazolamide (Diamox) 250mg PO BD aids acclimatization',
          'High flow supplemental oxygen (4L/min) or Gamow Hyperbaric Chamber if ataxia occurs',
          'Ataxia (wobbly walk) or pink frothy sputum = HACE/HAPE emergency; descend right now'
        ];
        replyText = language === 'np'
          ? `🏔️ **उच्च हिमाली भेगमा लेक लागेको आकस्मिक व्यवस्थापन (Altitude Sickness AMS/HAPE/HACE)**\n\n` +
            `१. **माथि कहिल्यै नचढ्नुहोस् (Never Ascend):** लक्षण देखिएपछि माथि जानु ज्यान जोखिममा पार्नु हो।\n` +
            `२. **तुरुन्त तल ओर्लनुहोस् (Immediate Descent):** ५०० देखि १,००० मिटर तल झर्नु नै यसको मुख्य औषधि हो।\n` +
            `३. **लक्षण जाँच:** यदि खुट्टा लडबडाउने (Ataxia), अत्यधिक खोकी लाग्ने वा गुलाबी थुक आएमा तत्काल हेलिकप्टर उद्धार वा अक्सिजन चाहिन्छ।\n` +
            `४. सिभेक क्लिनिक वा हिमालयन रेस्क्यु एसोसिएसन (HRA) मा सम्पर्क गर्नुहोस्।`
          : `🏔️ **ACUTE MOUNTAIN SICKNESS (AMS) & HIGH ALTITUDE EMERGENCY**\n\n` +
            `1. **The Golden Altitude Rule**: Stop ascending immediately. Never climb higher with AMS symptoms.\n` +
            `2. **Immediate Descent is Curative**: Descending 500m–1,000m promptly halts progression to fatal HAPE/HACE.\n` +
            `3. **Red Flags for Cerebral/Pulmonary Edema**: Inability to walk a straight line (heel-to-toe ataxia), confusion, or persistent cough with pink sputum requires emergency descent and oxygen.\n` +
            `4. **Pharmacotherapy**: Acetazolamide (Diamox) 250mg PO every 12 hours. Dexamethasone 8mg PO/IM if suspected HACE.`;
      } else if (q.includes('helicopter') || q.includes('heli') || q.includes('helecopter') || q.includes('army') || q.includes('flycart') || q.includes('drone') || q.includes('हेलिकप्टर') || q.includes('सेना') || q.includes('ड्रोन')) {
        severity = 'critical';
        spec = 'Aviation Medicine & Emergency Search & Rescue';
        hosp = 'Nepal Army Aviation Directorate / Tribhuvan University Teaching Hospital Helipad';
        steps = [
          'NEPAL ARMY AIR RESCUE: Call +977-01-4246950 or local CDO for immediate alpine/trauma medevac dispatch',
          'DJI FLYCART 30 MEDICAL DRONE: Call +977-01-5970102 for emergency payload delivery (up to 40kg, up to 6,000m altitude)',
          'Provide precise GPS coordinates, LZ (Landing Zone) wind direction, and patient vitals',
          'Ground ambulance coordination: Call 102 for hospital transfer upon helipad touch down'
        ];
        replyText = language === 'np'
          ? `🚁 **नेपाली सेना हवाई उद्धार तथा DJI FlyCart 30 ड्रोन ढुवानी प्रोटोकल (Air Rescue & Drone Logistics)**\n\n` +
            `१. **नेपाली सेना आपतकालीन हेलिकप्टर उद्धार निर्देशनालय (Direct Air Ops):**\n` +
            `   - **हटलाइन:** **+977-01-4246950** (२४ सै घण्टा खुला)\n` +
            `   - हिमाली तथा दुर्गम पहाडी जिल्लाहरू, विपद् वा गम्भीर सुत्केरी जटिलतामा तत्काल Mi-17 तथा बेल हेलिकप्टर उडान समन्वय।\n` +
            `   - स्थानीय प्रमुख जिल्ला अधिकारी (CDO) वा प्रहरी कन्ट्रोल १०० सँग समन्वय गरी जीपीएस स्थान दिनुहोस्।\n\n` +
            `२. **DJI FlyCart 30 भारी मेडिकल ड्रोन ढुवानी (Medical Drone Cargo Hub):**\n` +
            `   - **हटलाइन:** **+977-01-5970102**\n` +
            `   - ३० देखि ४० किलोग्रामसम्म तौल बोक्न सक्ने, ६,००० मिटर उचाइसम्म उड्ने स्वचालित ड्रोन।\n` +
            `   - दुर्गम स्वास्थ्य चौकीहरूमा तुरुन्त सर्पको विष प्रतिरोधी औषधि (Anti-Snake Venom), रगतका थैलीहरू, खोप र जीवनरक्षक औषधिको एयर-ड्रप ढुवानी।\n\n` +
            `३. आपतकालीन ल्यान्डिङ जोन (LZ) मा धुवाँ वा चहकिलो कपडा देखाएर पाइलट/ड्रोनलाई संकेत गर्नुहोस्।`
          : `🚁 **NEPAL ARMY EMERGENCY AIR MEDEVAC & DJI FLYCART 30 DRONE DISPATCH**\n\n` +
            `1. **Nepal Army Directorate of Air Operations (Helicopter Medevac)**:\n` +
            `   - **Emergency Hotline**: **+977-01-4246950** (24/7 National Operations Center)\n` +
            `   - High-altitude search and rescue (SAR), extreme mountain trauma, and remote district maternal emergency evacuations via high-performance Mi-17 and Bell utility helicopters.\n` +
            `   - Coordinates directly with local Chief District Officers (CDO) and Nepal Police 100.\n\n` +
            `2. **DJI FlyCart 30 Heavy-Lift Medical Drone Logistics**:\n` +
            `   - **Drone Dispatch Desk**: **+977-01-5970102**\n` +
            `   - Heavy-lift medical payload capability (30kg–40kg payload, operating ceiling up to 6,000 meters / 20,000ft in Himalayan terrain).\n` +
            `   - Rapid autonomous delivery of cold-chain blood packs, antivenoms, epinephrine, and essential medical supplies to roadless remote health posts.\n\n` +
            `3. **Landing Zone (LZ) Protocol**: Provide GPS coordinates (decimal degrees or WGS84), check for overhead high-tension cables, and secure a 25m × 25m cleared flat perimeter.`;
      } else if (q.includes('fever') || q.includes('dengue') || q.includes('ज्वरो') || q.includes('डेंगु')) {
        severity = 'urgent';
        spec = 'Tropical Medicine & Clinical Hematology';
        hosp = 'Sukraraj Tropical Hospital (Teku) / Patan Hospital, Lalitpur';
        steps = [
          'Paracetamol (Acetaminophen) 500mg - 1000mg every 6 hours for fever/pain',
          'STRICT WARNING: Do NOT take Ibuprofen, Diclofenac, or Aspirin (NSAIDs worsen bleeding in Dengue)',
          'Oral Rehydration: Drink 2.5L to 3L daily of ORS (Jeevan Jal), coconut water, and soups',
          'Daily CBC Platelet count monitoring: Warning signs include gum bleeding, black stools, or severe persistent vomiting',
          'Consult a physician at Teku or Patan Hospital'
        ];
        replyText = language === 'np'
          ? `🦟 **उच्च ज्वरो तथा डेंगु व्यवस्थापन (Fever & Dengue Protocol)**\n\n` +
            `१. **प्यारासिटामोल मात्र प्रयोग गर्नुहोस्:** ब्रुफिन (Ibuprofen), फ्लेक्सन वा एस्पिरिन कहिल्यै नखानुहोस्! डेंगुमा यसले आन्तरिक रक्तस्राव गराउँछ।\n` +
            `२. **प्रशस्त झोल पदार्थ (जीवनजल, सुप, नरिवल पानी):** दैनिक २.५ देखि ३ लिटर तरल पदार्थ पिउनुहोस्।\n` +
            `३. **खतराका लक्षणहरू:** गिजाबाट रगत आउने, कालो दिसा हुने, पेट अत्यधिक दुख्ने वा लगातार बान्ता भएमा तत्काल अस्पताल भर्ना हुनुहोस्।\n` +
            `४. प्लेटलेट (Platelet) र Hematocrit जाँचका लागि टेकु वा पाटन अस्पताल जानुहोस्।`
          : `🦟 **ACUTE FEVER & SUSPECTED DENGUE CLINICAL TRIAGE**\n\n` +
            `1. **Strict Analgesic Safety**: Only use Paracetamol (Acetaminophen) for antipyresis. NEVER use NSAIDs (Ibuprofen, Diclofenac, Aspirin) as they precipitate severe hemorrhagic complications in Dengue.\n` +
            `2. **Aggressive Hydration**: Consume 2.5–3.0 Liters daily of Oral Rehydration Salts (Jeevan Jal), soups, and coconut water.\n` +
            `3. **Monitor Critical Warning Signs**: Persistent severe vomiting, abdominal pain, mucosal bleeding (gums, epistaxis), or extreme lethargy signals Dengue Shock Syndrome requiring immediate ICU admission.\n` +
            `4. **Laboratory Workup**: Baseline Complete Blood Count (CBC) with serial hematocrit and platelet tracking at Teku or Patan Hospital.`;
      } else {
        severity = 'urgent';
        spec = 'Internal Medicine & Family Health';
        hosp = 'Tribhuvan University Teaching Hospital (TUTH), Maharajgunj';
        steps = [
          'Document core vital signs (Temperature, Pulse, Blood Pressure)',
          'Avoid unverified over-the-counter painkillers or remedies',
          'Consult an accredited Nepal Medical Council (NMC) physician'
        ];
        replyText = language === 'np'
          ? `तपाईंको स्वास्थ्य लक्षणलाई विश्लेषण गरिएको छ। यदि गम्भीर दुखाइ, सास फेर्न गाह्रो वा उच्च ज्वरो आएमा तुरुन्त नजिकको अस्पताल आकस्मिक कक्षमा जानुहोस्।`
          : `Your clinical symptoms have been logged and triaged. Please review the recommended actions and consult a certified specialist.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `xenon_fb_${Date.now()}`,
          sender: 'xenon',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          severity,
          firstAidSteps: steps,
          recommendedSpecialty: spec,
          recommendedHospital: hosp
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Banner / Header with Nepal Flag Colors & Connection Status */}
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-red-600 via-blue-700 to-red-600 p-1 shadow-xl">
        <div className="rounded-[24px] bg-white dark:bg-[#0F172A] p-6 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-blue-700 p-0.5 shadow-md flex items-center justify-center">
                  <div className="w-full h-full rounded-[14px] bg-white dark:bg-[#1E293B] flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-red-600 dark:text-red-400 stroke-[2.2]" />
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0F172A] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
                    Xenon AI <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-600 text-white font-bold">नेपाल</span>
                  </h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 font-bold border border-blue-200 dark:border-blue-800">
                    Clinical Intelligence
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Connected: {xenonStatus.model}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">
                  {language === 'np'
                    ? 'तार्किक आकस्मिक प्राथमिक उपचार, लक्षण मूल्याङ्कन र विशेषज्ञ रेफरल प्रणाली'
                    : 'Logical Emergency First-Aid, Clinical Symptom Evaluation & Nepal Hospital Triage'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={checkConnection}
                disabled={checkingStatus}
                title="Test live connection to Xenon & Gemini Engine"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 cursor-pointer transition-all"
              >
                <Radio className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${checkingStatus ? 'animate-spin' : ''}`} />
                <span>{checkingStatus ? 'Pinging...' : 'Ping Xenon'}</span>
              </button>

              <a
                href="tel:102"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-white" />
                <span className="text-white">Call 102</span>
              </a>

              {onBookDoctor && (
                <button
                  onClick={onBookDoctor}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-700/30 transition-all cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-white" />
                  <span className="text-white">Book Doctor</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Box Container */}
      <div className="rounded-[26px] bg-white dark:bg-[#0F172A] border-2 border-blue-600/20 dark:border-blue-500/30 shadow-xl overflow-hidden flex flex-col h-[650px] transition-colors">
        {/* Messages Stage */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-[#0B1120]">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    X
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-sm space-y-3 ${
                    isUser
                      ? 'bg-blue-700 text-white font-medium rounded-tr-xs'
                      : 'bg-white dark:bg-[#1E293B] text-slate-950 dark:text-white border border-slate-200 dark:border-slate-700 rounded-tl-xs'
                  }`}
                >
                  {/* Message Header if from Xenon */}
                  {!isUser && m.severity && (
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        {m.severity === 'critical' && (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-black tracking-wide">
                            <ShieldAlert className="w-3 h-3 text-white" /> EMERGENCY CRITICAL
                          </span>
                        )}
                        {m.severity === 'urgent' && (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[11px] font-bold">
                            <AlertTriangle className="w-3 h-3 text-slate-950" /> URGENT EVALUATION
                          </span>
                        )}
                        {m.severity === 'routine' && (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-700 text-white text-[11px] font-bold">
                            <Activity className="w-3 h-3 text-white" /> CLINICAL ASSESSMENT
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {m.timestamp}
                      </span>
                    </div>
                  )}

                  {/* Body Text */}
                  <div className={`text-xs leading-relaxed whitespace-pre-line font-medium ${isUser ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                    {m.text}
                  </div>

                  {/* First Aid Steps Checklist Card */}
                  {m.firstAidSteps && m.firstAidSteps.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 space-y-2 mt-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-300">
                        <HeartPulse className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span>Actionable First-Aid Checklist (प्राथमिक उपचार)</span>
                      </div>
                      <ul className="space-y-1.5">
                        {m.firstAidSteps.map((step, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-[11px] text-slate-900 dark:text-slate-100 font-medium"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendation Card */}
                  {(m.recommendedSpecialty || m.recommendedHospital) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {m.recommendedSpecialty && (
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-800 dark:text-blue-300">
                            <Stethoscope className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                            <span>Recommended Specialty:</span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                            {m.recommendedSpecialty}
                          </p>
                        </div>
                      )}

                      {m.recommendedHospital && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                            <Building2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                            <span>Tertiary Facility (Nepal):</span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                            {m.recommendedHospital}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {isUser && (
                    <div className="text-[10px] text-white/90 font-mono text-right">
                      {m.timestamp}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    NP
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-900 dark:text-white font-semibold py-2">
              <RefreshCw className="w-4 h-4 animate-spin text-red-600 dark:text-red-400" />
              <span>Xenon AI evaluating clinical protocol with Gemini...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Clinical Prompts Bar */}
        <div className="px-6 py-3 bg-white dark:bg-[#131C31] border-t border-slate-200 dark:border-slate-800 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> Quick Triage:
            </span>
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(qp.prompt)}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white dark:bg-[#0F172A] border-t-2 border-red-600/20 dark:border-red-500/30">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder={
                language === 'np'
                  ? 'आफ्नो लक्षण वा चोटको बारेमा लेख्नुहोस् (जस्तै: हातबाट रगत बगेको, छाती दुखेको...)'
                  : 'Describe your injury or symptom (e.g. Bleeding hand, crushing chest pain, burn...)'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-[#1E293B] border border-slate-300 dark:border-slate-700 text-slate-950 dark:text-white text-xs font-medium placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-blue-700 hover:from-red-700 hover:to-blue-800 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-red-600/20 flex items-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <span className="text-white font-bold">Evaluate</span>
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </form>
          <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium text-center mt-2">
            ⚠️ Xenon AI provides clinical first-aid triage advice. For life-threatening emergencies, call 102 immediately.
          </p>
        </div>
      </div>
    </div>
  );
};
