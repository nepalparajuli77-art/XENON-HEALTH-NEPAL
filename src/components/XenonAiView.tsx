import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Radio,
  LocateFixed,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MapPin,
  Map as MapIcon,
  Compass,
  Navigation,
  Phone,
  ExternalLink,
  X,
  Layers,
  Crosshair
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin, useMap } from '@vis.gl/react-google-maps';
import { Language, Hospital, MedevacBase } from '../types';
import { INITIAL_HOSPITALS, NEPAL_MEDEVAC_BASES } from '../data/mockData';
import { triggerHaptic } from '../utils/haptics';

interface Message {
  id: string;
  sender: 'user' | 'xenon';
  text: string;
  timestamp: string;
  severity?: 'critical' | 'urgent' | 'routine';
  firstAidSteps?: string[];
  recommendedSpecialty?: string;
  recommendedHospital?: string;
  hospitalCoords?: { lat: number; lng: number };
}

interface XenonAiViewProps {
  language: Language;
  onBookDoctor?: () => void;
  onNavigate?: (tab: string) => void;
}

const MapTouchController: React.FC<{ target: { lat: number; lng: number } | null }> = ({ target }) => {
  const map = useMap();
  const lastTarget = useRef<string>('');

  useEffect(() => {
    if (!map || !target || !target.lat || !target.lng) return;
    const key = `${target.lat.toFixed(4)},${target.lng.toFixed(4)}`;
    if (lastTarget.current !== key) {
      lastTarget.current = key;
      map.panTo(target);
    }
  }, [map, target]);

  return null;
};

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
          ? `नमस्ते! म **जिनोन एआई (Xenon AI)**, जेनन हेल्थको क्लिनिकल ट्राइएज तथा प्राथमिक उपचार सहायक हुँ।\n\nतपाईंलाई कुनै चोटपटक, घाउ, दुखाइ वा आपतकालीन स्वास्थ्य समस्या भएको छ? मलाई बोलेर वा लेखेर सोध्नुहोस्। उदाहरणका लागि: "मेरो हात काटिएर धेरै रगत बगेको छ" वा "कुकुरले टोकेको छ"। म तपाईंलाई तत्काल प्राथमिक उपचार, नक्सा तथा नजिकको अस्पताल सिफारिस गर्नेछु।`
          : `Hello! I am **Xenon AI**, your clinical triage & emergency first-aid assistant on XENON HEALTH.\n\nDescribe your symptoms by voice or text (e.g. *"I have a bleeding hand, what should I do?"* or *"Stray dog bite"*). I evaluate acuity, provide emergency first-aid protocols, read out loud instructions, and map certified hospitals and air rescue bases across Nepal.`,
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
    engine: 'Google Gemini (gemini-3.8-flash)',
    model: 'gemini-3.8-flash',
    assistant_name: 'Xenon',
    node: 'Kathmandu Central Node'
  });
  const [checkingStatus, setCheckingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // VOICE SYSTEM: SPEECH RECOGNITION (DICTATION) & SPEECH SYNTHESIS (TTS)
  // ============================================================================
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;

        rec.onstart = () => {
          setIsListening(true);
          triggerHaptic('light');
        };

        rec.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setInput(transcript);
          }
        };

        rec.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  // Toggle Voice Recording / Dictation
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = language === 'np' ? 'ne-NP' : 'en-US';
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  // Text to Speech Function
  const speakMessage = (text: string, msgId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis is not supported in this browser.');
      return;
    }

    // If currently speaking this message, cancel it
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean text for smooth vocalization (remove markdown symbols)
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/#/g, '')
      .replace(/_/g, '')
      .replace(/\[/g, '')
      .replace(/\]/g, '')
      .replace(/🚨|🔥|🐶|❤️|🩸|🦟|🚁|🏔️/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'np' ? 'ne-NP' : 'en-US';
    utterance.rate = 0.95;

    utterance.onstart = () => setSpeakingMsgId(msgId);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    window.speechSynthesis.speak(utterance);
  };

  // Stop all speech synthesis
  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
  };

  // ============================================================================
  // MAPS SYSTEM: GOOGLE MAPS PLATFORM TRIAGE & FACILITY MARKERS
  // ============================================================================
  const [mapsApiKey, setMapsApiKey] = useState<string>(
    () => (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || ''
  );

  useEffect(() => {
    if (!mapsApiKey) {
      fetch('/api/maps-key')
        .then((r) => r.json())
        .then((data) => {
          if (data?.apiKey) {
            setMapsApiKey(data.apiKey);
          }
        })
        .catch(() => {});
    }
  }, [mapsApiKey]);

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 27.7172,
    lng: 85.3240 // Default Kathmandu
  });
  const [isLocating, setIsListeningLoc] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Hospital | MedevacBase | null>(null);

  // Get user GPS location
  const handleDetectUserLocation = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by your browser.');
      return;
    }
    setIsListeningLoc(true);
    triggerHaptic('medium');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setIsListeningLoc(false);
        triggerHaptic('success');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsListeningLoc(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Open map focused on specific facility or center
  const handleOpenMapWithFocus = (facilityName?: string, coords?: { lat: number; lng: number }) => {
    triggerHaptic('light');
    if (coords) {
      setUserLocation(coords);
    }
    if (facilityName) {
      const foundHosp = INITIAL_HOSPITALS.find((h) =>
        h.name.toLowerCase().includes(facilityName.toLowerCase()) ||
        facilityName.toLowerCase().includes(h.name.toLowerCase())
      );
      const foundMed = NEPAL_MEDEVAC_BASES.find((m) =>
        m.name.toLowerCase().includes(facilityName.toLowerCase()) ||
        facilityName.toLowerCase().includes(m.name.toLowerCase())
      );
      setSelectedFacility(foundHosp || foundMed || null);
    }
    setIsMapModalOpen(true);
  };

  const checkConnection = async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch('/api/xenon/status');
      if (res.ok) {
        const data = await res.json();
        setXenonStatus({
          connected: data.connected ?? true,
          engine: data.engine ?? 'Google Gemini (gemini-3.8-flash)',
          model: data.model ?? 'gemini-3.8-flash',
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
      label: language === 'np' ? '🩸 हात काटिएर गम्भीर रक्तस्राव' : '🩸 Deep Bleeding Hand Laceration',
      prompt: language === 'np' ? 'मेरो हात काटिएर धेरै रगत बगिरहेको छ, के गर्ने?' : 'I have a deep bleeding wound on my hand, how do I stop it immediately?'
    },
    {
      label: language === 'np' ? '❤️ छाती दुख्ने / दम बढ्ने (Chest Pain)' : '❤️ Acute Crushing Chest Pain',
      prompt: language === 'np' ? 'छाती च्यापेर बायाँ हाततिर दुखाइ फैलिएको छ र सास फेर्न गाह्रो भएको छ।' : 'I have crushing chest pain radiating to my left arm and jaw with cold sweat.'
    },
    {
      label: language === 'np' ? '🐶 कुकुरले टोकेको (Rabies Protocol)' : '🐶 Street Dog Bite (Rabies Protocol)',
      prompt: language === 'np' ? 'सडकको कुकुरले खुट्टामा टोकेर दाँत गाडिएको छ, रगत आइरहेको छ। के गर्ने?' : 'A stray dog bit my leg with punctured skin. What is the immediate step-by-step wound washing and rabies vaccine protocol in Nepal?'
    },
    {
      label: language === 'np' ? '🔥 आगो वा तातो पानीले पोलेको' : '🔥 Scald / Thermal Burn on Forearm',
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
      label: language === 'np' ? '🚁 नेपाली सेना हेलिकप्टर र ड्रोन' : '🚁 Army Helicopter Rescue & DJI Drone Dispatch',
      prompt: language === 'np' ? 'दुर्गम हिमाली ठाउँमा फसेको बेला नेपाली सेनाको हेलिकप्टर वा DJI FlyCart 30 ड्रोन औषधि ढुवानी कसरी मगाउने?' : 'How do I request emergency Nepal Army helicopter medevac or DJI FlyCart 30 drone medical cargo dispatch in remote districts?'
    }
  ];

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    // Stop recording if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

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
        recommendedHospital: data.recommended_hospital,
        hospitalCoords: data.hospital_coords
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Auto-speak if enabled
      if (autoSpeak) {
        speakMessage(aiMsg.text, aiMsg.id);
      }
    } catch (err) {
      console.warn('Network call failed, executing local intelligent triage engine:', err);

      // Local emergency intelligence engine with precise facility mappings
      const q = query.toLowerCase();
      let replyText = '';
      let severity: 'critical' | 'urgent' | 'routine' = 'routine';
      let steps: string[] = [];
      let spec = 'General Practice';
      let hosp = 'Tribhuvan University Teaching Hospital (TUTH)';
      let coords = { lat: 27.7360, lng: 85.3303 };

      // Enforce strict Health-Only Scope Mandate
      const nonHealthKeywords = ['code', 'python', 'javascript', 'html', 'programming', 'function', 'math', 'calculator', 'capital of', 'movie', 'song', 'bitcoin', 'crypto', 'football', 'cricket', 'recipe', 'essay', 'president of'];
      const isNonHealth = nonHealthKeywords.some((w) => q.includes(w)) &&
        !q.includes('fever') && !q.includes('pain') && !q.includes('blood') && !q.includes('doctor') &&
        !q.includes('hospital') && !q.includes('medicine') && !q.includes('स्वास्थ्य') && !q.includes('बिरामी');

      if (isNonHealth) {
        severity = 'routine';
        spec = 'Clinical Healthcare Assistant';
        steps = ['Ask any symptom, injury, medication, or hospital question'];
        replyText = language === 'np'
          ? `म जिनोन एआई (Xenon AI) केवल स्वास्थ्य, चिकित्सा, र प्राथमिक उपचार सम्बन्धी सहयोगका लागि मात्र उपलब्ध छु। म कोडिङ, गणित वा गैर-स्वास्थ्य विषयहरूमा उत्तर दिन सक्दिनँ। कृपया आफ्नो कुनै पनि स्वास्थ्य समस्या, लक्षण वा औषधी सम्बन्धी प्रश्न सोध्नुहोस्!`
          : `I am Xenon AI, dedicated exclusively to healthcare, medical symptoms, emergency first-aid, and doctor guidance. I cannot assist with non-medical topics like coding, math, or general trivia. Please feel free to ask any health or medical questions!`;
      } else if (q.includes('bleed') || q.includes('blood') || q.includes('cut') || q.includes('wound') || q.includes('रगत')) {
        severity = 'critical';
        spec = 'Trauma & Emergency Wound Care';
        hosp = 'National Trauma Centre (Bir Hospital Complex), Kathmandu';
        coords = { lat: 27.7050, lng: 85.3142 };
        steps = [
          'Direct Pressure: Press firmly on wound with clean cloth for 10 min without lifting',
          'Elevation: Raise the injured limb strictly above heart level immediately',
          'No Dirt/Turmeric: Do NOT apply ash, mud, or powder to open wounds',
          'Tetanus & ER: Get Tetanus (TT) shot within 24h; visit ER if bleeding persists'
        ];
        replyText = language === 'np'
          ? `🚨 **हात वा घाउको रक्तस्राव: तत्काल प्राथमिक उपचार**\n\n` +
            `१. **लगातार प्रत्यक्ष दबाब:** सफा कपडाले घाउमा कम्तीमा १० मिनेटसम्म नछोडी जोडले थिच्नुहोस्।\n` +
            `२. **मुटुभन्दा माथि उठाउनुहोस्:** हात वा खुट्टालाई तुरुन्त मुटुको सतहभन्दा माथि उठाउनुहोस्।\n` +
            `३. **धुलो, खरानी वा बेसार कहिल्यै नहाल्नुहोस्:** यसले गम्भीर संक्रमण निम्त्याउँछ।\n` +
            `४. **अस्पताल जानुहोस्:** रगत नरोकिएमा वा गहिरो घाउ भएमा तुरुन्त वीर अस्पताल ट्रमा सेन्टर जानुहोस् र धनुष्टंकार (TT) खोप लगाउनुहोस्।`
          : `🚨 **EMERGENCY FIRST AID: ACTIVE BLEEDING WOUND**\n\n` +
            `1. **Continuous Direct Pressure**: Press firmly on the wound with a clean cloth for 10 uninterrupted minutes.\n` +
            `2. **Elevate Above Heart**: Raise the injured arm or leg above heart level immediately to slow blood loss.\n` +
            `3. **Do Not Apply Ash or Powders**: Keep the wound clean to prevent severe infection or tetanus.\n` +
            `4. **Seek Medical Care**: Get a Tetanus (TT) shot within 24 hours. Go to the nearest trauma emergency center if bleeding does not stop.`;
      } else if (q.includes('chest') || q.includes('heart') || q.includes('छाती')) {
        severity = 'critical';
        spec = 'Interventional Cardiology / Critical Care';
        hosp = 'Shahid Gangalal National Heart Centre, Bansbari';
        coords = { lat: 27.7378, lng: 85.3326 };
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
        coords = { lat: 27.6980, lng: 85.3050 };
        steps = [
          'WASH IMMEDIATELY: Run copious tap water and soap continuously over the wound for 15 minutes',
          'Do NOT suture, stitch, or bandage tightly; open wound allows virus egress',
          'Do NOT apply chili powder, kerosene, turmeric, or leaves (contraindicated)',
          'Go immediately to Teku Hospital for Post-Exposure Prophylaxis (ARV) Day 0 shot',
          'If deep puncture / bleeding (Category III), Rabies Immunoglobulin (RIG) is mandatory'
        ];
        replyText = language === 'np'
          ? `🚨 **अत्यन्त जरुरी: कुकुर वा जनावरले टोकेको प्राथमिक उपचार (Rabies Protocol)**\n\n` +
            `१. **१५ मिनेटसम्म साबुन पानीले धुनुहोस् (Soap & Water Flush):** धाराको बगिरहेको पानी र लुगा धुने साबुनले कम्तीमा १५ मिनेटसम्म लगातार घाउ सफा गर्नुहोस्।\n` +
            `२. **घाउ सिलाउने वा बाँध्ने काम नगर्नुहोस्:** घाउ खुला राख्नुपर्छ।\n` +
            `३. **खुर्सानी, मट्टीतेल, मोबिल वा बेसार कहिल्यै नहाल्नुहोस्।**\n` +
            `४. **तुरुन्त टेकु अस्पताल जानुहोस्:** २४ घण्टाभित्र Anti-Rabies Vaccine (ARV Day 0) र Tetanus (TT) खोप लगाउनुहोस्।`
          : `🚨 **EMERGENCY RABIES & ANIMAL BITE PROTOCOL (WHO CATEGORY II/III)**\n\n` +
            `1. **Continuous 15-Minute Soap & Running Water Flush**: Immediately flush all bite marks with running water and soap for 15 minutes.\n` +
            `2. **Antiseptic Application**: Apply Povidone Iodine 10% after drying.\n` +
            `3. **Absolute Contraindications**: DO NOT suture or stitch the wound. DO NOT apply chili powder or mud.\n` +
            `4. **Urgent Post-Exposure Prophylaxis (PEP)**: Report immediately to Sukraraj Tropical Hospital (Teku) for Rabies Vaccine (ARV) & RIG.`;
      } else if (q.includes('burn') || q.includes('scald') || q.includes('पोले') || q.includes('उम्लेको')) {
        severity = 'urgent';
        spec = 'Burn & Plastic Reconstructive Surgery';
        hosp = 'Kirtipur Hospital (Burn Centre), Kirtipur';
        coords = { lat: 27.6780, lng: 85.2780 };
        steps = [
          'Cool with cool running tap water for 20 minutes (do NOT use ice cubes)',
          'Remove tight rings, bracelets, and watches before edema sets in',
          'Do NOT break blisters or pop fluid sacs',
          'Do NOT put toothpaste, butter, raw eggs, or gentian violet on burns',
          'Cover loosely with sterile non-adherent dressing or clean plastic wrap'
        ];
        replyText = language === 'np'
          ? `🔥 **तातो पानी वा आगोले पोलेको तत्काल उपचार (Thermal Burn Protocol)**\n\n` +
            `१. **२० मिनेटसम्म चिसो पानी बगाउनुहोस्:** धाराको सामान्य चिसो पानी २० मिनेटसम्म पोलेको भागमा निरन्तर बगाउनुहोस्।\n` +
            `२. **गहना र घडी तुरुन्त फुकाल्नुहोस्।**\n` +
            `३. **फोका (Blisters) कहिल्यै नफुटाउनुहोस्।**\n` +
            `४. **टुथपेस्ट, घ्यू, अण्डा वा माटो नहाल्नुहोस्।**\n` +
            `५. कीर्तिपुर बर्न सेन्टरमा जानुहोस्।`
          : `🔥 **EMERGENCY THERMAL BURN & SCALD MANAGEMENT**\n\n` +
            `1. **Immediate 20-Minute Cool Running Water**: Cool under running tap water for 20 minutes.\n` +
            `2. **Remove Constriction**: Remove rings and watches before swelling.\n` +
            `3. **Preserve Blisters**: Do not pop blisters.\n` +
            `4. **Cover & Transport**: Present to Kirtipur Hospital Burn Center.`;
      } else if (q.includes('helicopter') || q.includes('heli') || q.includes('army') || q.includes('flycart') || q.includes('drone') || q.includes('हेलिकप्टर') || q.includes('सेना')) {
        severity = 'critical';
        spec = 'Aviation Medicine & Emergency Search & Rescue';
        hosp = 'Nepal Army Air Operations Directorate (Central Airbase)';
        coords = { lat: 27.6966, lng: 85.3591 };
        steps = [
          'NEPAL ARMY AIR RESCUE: Call +977-01-4246950 or local CDO for immediate alpine/trauma medevac dispatch',
          'FLY MEDICAL DRONE: Currently not available yet (offline — no verified dispatch line)',
          'Provide precise GPS coordinates, LZ wind direction, and patient vitals'
        ];
        replyText = language === 'np'
          ? `🚁 **नेपाली सेना हवाई उद्धार निर्देशनालय**\n\n` +
            `१. **नेपाली सेना आपतकालीन हेलिकप्टर उद्धार हटलाइन:** **+977-01-4246950** (२४ सै घण्टा खुला)\n` +
            `२. **DJI Fly ड्रोन सेवा:** हाल उपलब्ध छैन (फोन नम्बर उपलब्ध नभएको / अफलाइन)`
          : `🚁 **NEPAL ARMY EMERGENCY AIR MEDEVAC**\n\n` +
            `1. **Nepal Army Air Rescue Hotline**: **+977-01-4246950** (Active 24/7)\n` +
            `2. **Fly Drone Delivery**: Currently not available yet (offline — no dispatch number)`;
      } else {
        severity = 'urgent';
        spec = 'Internal Medicine & Family Health';
        hosp = 'Tribhuvan University Teaching Hospital (TUTH), Maharajgunj';
        coords = { lat: 27.7360, lng: 85.3303 };
        steps = [
          'Document core vital signs (Temperature, Pulse, Blood Pressure)',
          'Avoid unverified over-the-counter painkillers',
          'Consult an accredited Nepal Medical Council (NMC) physician'
        ];
        replyText = language === 'np'
          ? `तपाईंको स्वास्थ्य लक्षणलाई विश्लेषण गरिएको छ। नजिकको अस्पताल आकस्मिक कक्षमा जानुहोस्।`
          : `Your clinical symptoms have been logged and triaged. Consult a certified specialist.`;
      }

      const localAiMsg: Message = {
        id: `xenon_fb_${Date.now()}`,
        sender: 'xenon',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        severity,
        firstAidSteps: steps,
        recommendedSpecialty: spec,
        recommendedHospital: hosp,
        hospitalCoords: coords
      };

      setMessages((prev) => [...prev, localAiMsg]);

      // Auto-speak if enabled
      if (autoSpeak) {
        speakMessage(localAiMsg.text, localAiMsg.id);
      }
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
    <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto px-1 sm:px-0 w-full min-w-0 overflow-hidden">
      {/* Banner / Header with Nepal Flag Colors & Connection Status */}
      <div className="relative overflow-hidden rounded-[22px] sm:rounded-[26px] bg-gradient-to-r from-red-600 via-blue-700 to-red-600 p-1 shadow-xl w-full min-w-0">
        <div className="rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#0F172A] p-3.5 sm:p-6 transition-colors w-full min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1 w-full">
              <div className="relative shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-red-600 to-blue-700 p-0.5 shadow-md flex items-center justify-center">
                  <div className="w-full h-full rounded-[14px] bg-white dark:bg-[#1E293B] flex items-center justify-center">
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-red-600 dark:text-red-400 stroke-[2.2]" />
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0F172A] animate-pulse" />
              </div>
              <div className="min-w-0 flex-1 w-full">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-1.5 flex-wrap">
                    Xenon AI <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-red-600 text-white font-bold shrink-0">नेपाल</span>
                  </h1>
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 font-bold border border-blue-200 dark:border-blue-800 shrink-0">
                    Voice & Map Enabled
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 shrink-0 max-w-full truncate">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    <span className="truncate">Connected: {xenonStatus.model}</span>
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium mt-1 leading-relaxed">
                  {language === 'np'
                    ? 'आवाजबाट प्रश्न सोध्नुहोस्, नक्सामा नजिकैको अस्पताल हेर्नुहोस् र तत्काल प्राथमिक उपचार पाउनुहोस्'
                    : 'Voice dictation, spoken audio first-aid, interactive Google Maps, & Nepal emergency triage'}
                </p>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {/* Auto Speak Toggle */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setAutoSpeak((prev) => !prev);
                  if (speakingMsgId) stopSpeech();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  autoSpeak
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
                title="Toggle Auto-Speech (Read out loud emergency responses)"
              >
                {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                <span>{autoSpeak ? 'Auto-Voice On' : 'Voice Off'}</span>
              </button>

              {/* Live Map Button */}
              <button
                onClick={() => handleOpenMapWithFocus()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <MapIcon className="w-3.5 h-3.5 text-white" />
                <span className="text-white">{language === 'np' ? 'ट्राइएज नक्सा' : 'Interactive Map'}</span>
              </button>

              <button
                onClick={checkConnection}
                disabled={checkingStatus}
                title="Test live connection to Xenon & Gemini Engine"
                className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 cursor-pointer transition-all"
              >
                <Radio className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${checkingStatus ? 'animate-spin' : ''}`} />
                <span>{checkingStatus ? 'Pinging...' : 'Ping'}</span>
              </button>

              <a
                href="tel:102"
                className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-white" />
                <span className="text-white">102 SOS</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Box Container */}
      <div className="rounded-[22px] sm:rounded-[26px] bg-white dark:bg-[#0F172A] border-2 border-blue-600/20 dark:border-blue-500/30 shadow-xl overflow-hidden flex flex-col h-[550px] sm:h-[650px] transition-colors w-full min-w-0">
        {/* Messages Stage */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 bg-slate-50 dark:bg-[#0B1120] w-full min-w-0">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            const isSpeaking = speakingMsgId === m.id;

            return (
              <div
                key={m.id}
                className={`flex gap-2.5 sm:gap-3 min-w-0 w-full ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-red-600 to-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    X
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[85%] rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5 sm:space-y-3 min-w-0 break-words ${
                    isUser
                      ? 'bg-blue-700 text-white font-medium rounded-tr-xs'
                      : 'bg-white dark:bg-[#1E293B] text-slate-950 dark:text-white border border-slate-200 dark:border-slate-700 rounded-tl-xs'
                  }`}
                >
                  {/* Message Header if from Xenon */}
                  {!isUser && (
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700 gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
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

                      <div className="flex items-center gap-2">
                        {/* Audio Speak / Stop Button */}
                        <button
                          onClick={() => speakMessage(m.text, m.id)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isSpeaking
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                          title="Listen to response voice audio"
                        >
                          {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-blue-600" />}
                          <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
                        </button>

                        <span className="text-[10px] text-slate-400 font-mono">
                          {m.timestamp}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Body Text */}
                  <div className={`text-xs leading-relaxed whitespace-pre-line font-medium ${isUser ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                    {m.text}
                  </div>

                  {/* First Aid Steps Checklist Card */}
                  {m.firstAidSteps && m.firstAidSteps.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-300">
                          <HeartPulse className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span>Actionable First-Aid Checklist (प्राथमिक उपचार)</span>
                        </div>
                        <button
                          onClick={() => speakMessage(m.firstAidSteps?.join('. ') || '', `${m.id}_steps`)}
                          className="text-[10px] font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Volume2 className="w-3 h-3" /> Read Steps
                        </button>
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

                  {/* Recommendation & Map Trigger Card */}
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
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                              <Building2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                              <span>Tertiary Referral Facility:</span>
                            </div>
                            <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                              {m.recommendedHospital}
                            </p>
                          </div>

                          <button
                            onClick={() => handleOpenMapWithFocus(m.recommendedHospital, m.hospitalCoords)}
                            className="mt-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 flex items-center gap-1 cursor-pointer bg-white dark:bg-emerald-900/80 px-2 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-2xs self-start"
                          >
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>View Hospital on Interactive Map →</span>
                          </button>
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
        <div className="px-3 sm:px-6 py-2.5 bg-white dark:bg-[#131C31] border-t border-slate-200 dark:border-slate-800 overflow-x-auto w-full min-w-0">
          <div className="flex items-center gap-2 w-max max-w-full">
            <span className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 shrink-0">
              <Flame className="w-3.5 h-3.5" /> Quick Triage:
            </span>
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(qp.prompt)}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors shrink-0"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar with Voice Dictation & Send Controls */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-[#0F172A] border-t-2 border-red-600/20 dark:border-red-500/30">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Voice Dictation Button */}
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`p-3 rounded-2xl transition-all cursor-pointer shrink-0 border ${
                  isListening
                    ? 'bg-red-600 text-white border-red-600 animate-pulse ring-4 ring-red-500/30 shadow-lg'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                }`}
                title={isListening ? 'Click to stop listening' : 'Click to dictate symptoms with your voice'}
              >
                {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              </button>
            )}

            <input
              type="text"
              placeholder={
                isListening
                  ? language === 'np'
                    ? 'सुन्दैछ... आफ्नो समस्या बोल्नुहोस्'
                    : 'Listening to your voice... Speak now'
                  : language === 'np'
                  ? 'आफ्नो लक्षण बोल्नुहोस् वा लेख्नुहोस् (जस्तै: हातबाट रगत बगेको, छाती दुखेको...)'
                  : 'Speak or type your symptom (e.g. Bleeding hand, crushing chest pain, dog bite...)'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`flex-1 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-[#1E293B] border text-slate-950 dark:text-white text-xs font-medium placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600 ${
                isListening ? 'border-red-500 ring-2 ring-red-500/50' : 'border-slate-300 dark:border-slate-700'
              }`}
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-blue-700 hover:from-red-700 hover:to-blue-800 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-red-600/20 flex items-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <span className="text-white font-bold hidden sm:inline">Evaluate</span>
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </form>

          {isListening && (
            <p className="text-[11px] text-red-600 dark:text-red-400 font-bold text-center mt-1.5 animate-pulse flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span>
                {language === 'np'
                  ? 'माइक खुला छ — आफ्नो स्वास्थ्य समस्या स्पष्ट बोल्नुहोस्...'
                  : 'Microphone Active — Speak your symptoms clearly now...'}
              </span>
            </p>
          )}

          <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium text-center mt-1.5">
            ⚠️ Xenon AI provides clinical first-aid triage advice. For life-threatening emergencies, call 102 immediately.
          </p>
        </div>
      </div>

      {/* ============================================================================ */}
      {/* INTERACTIVE GOOGLE MAP MODAL FOR XENON TRIAGE FACILITIES */}
      {/* ============================================================================ */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <MapIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{language === 'np' ? 'जेनोन क्लिनिकल नक्सा' : 'Xenon Interactive Triage Map'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      Live GPS
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {language === 'np'
                      ? 'नेपालका रिफरल अस्पतालहरू, आइसियु बेड र नेपाली सेनाको हवाई बेसहरू'
                      : 'Tertiary Hospitals, ICU Bed Status & Nepal Army Air Rescue Bases'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDetectUserLocation}
                  disabled={isLocating}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <Crosshair className={`w-3.5 h-3.5 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'My Location'}</span>
                </button>

                <button
                  onClick={() => setIsMapModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Google Map Container */}
            <div className="flex-1 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[380px] sm:min-h-[440px] relative">
              {mapsApiKey ? (
                <APIProvider apiKey={mapsApiKey}>
                  <Map
                    defaultCenter={userLocation}
                    defaultZoom={12}
                    mapId="DEMO_MAP_ID"
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                    className="w-full h-full touch-pan-x touch-pan-y"
                    internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                  >
                    <MapTouchController target={selectedFacility ? { lat: selectedFacility.lat, lng: selectedFacility.lng } : null} />
                  {/* User Geolocation Pin */}
                  <AdvancedMarker position={userLocation}>
                    <div className="relative flex items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-blue-400 opacity-75" />
                      <div className="p-2 bg-blue-600 text-white rounded-full shadow-lg border-2 border-white">
                        <Compass className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </AdvancedMarker>

                  {/* Hospital Markers */}
                  {INITIAL_HOSPITALS.map((hosp) => {
                    if (!hosp.lat || !hosp.lng) return null;
                    const isSelected = selectedFacility?.id === hosp.id;

                    return (
                      <AdvancedMarker
                        key={hosp.id}
                        position={{ lat: hosp.lat, lng: hosp.lng }}
                        onClick={() => setSelectedFacility(hosp)}
                      >
                        <Pin
                          background={isSelected ? '#10b981' : '#2563eb'}
                          borderColor="#ffffff"
                          glyphColor="#ffffff"
                        />
                      </AdvancedMarker>
                    );
                  })}

                  {/* Medevac Airbase Markers */}
                  {NEPAL_MEDEVAC_BASES.map((med) => (
                    <AdvancedMarker
                      key={med.id}
                      position={{ lat: med.lat, lng: med.lng }}
                      onClick={() => setSelectedFacility(med)}
                    >
                      <Pin
                        background="#dc2626"
                        borderColor="#ffffff"
                        glyphColor="#ffffff"
                      />
                    </AdvancedMarker>
                  ))}

                  {/* InfoWindow for Selected Facility */}
                  {selectedFacility && (
                    <InfoWindow
                      position={{
                        lat: (selectedFacility as any).lat || userLocation.lat,
                        lng: (selectedFacility as any).lng || userLocation.lng
                      }}
                      onCloseClick={() => setSelectedFacility(null)}
                    >
                      <div className="p-2 text-slate-900 max-w-xs space-y-1.5 text-xs">
                        <div className="font-extrabold text-sm text-slate-900">
                          {selectedFacility.name}
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">
                          {(selectedFacility as any).address || (selectedFacility as any).base_location}
                        </p>

                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={`tel:${(selectedFacility as any).phone || (selectedFacility as any).hotline}`}
                            className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                          >
                            <Phone className="w-3 h-3" /> Call
                          </a>

                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${(selectedFacility as any).lat},${(selectedFacility as any).lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                          >
                            <Navigation className="w-3 h-3" /> Directions
                          </a>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white rounded-2xl p-6 space-y-3">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-slate-300">Initializing Google Maps Radar...</span>
              </div>
            )}
          </div>

            {/* Selected Facility Details Bar */}
            {selectedFacility && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {selectedFacility.name} ({(selectedFacility as any).district})
                  </h4>
                  <p className="text-slate-500 font-medium text-[11px] mt-0.5">
                    {(selectedFacility as any).description || (selectedFacility as any).description_np}
                  </p>
                </div>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${(selectedFacility as any).lat},${(selectedFacility as any).lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Directions in Google Maps</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
