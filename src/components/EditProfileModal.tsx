import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Save,
  CheckCircle2,
  Droplets,
  ShieldCheck,
  Heart
} from 'lucide-react';
import { User, Language } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { api } from '../services/api';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  language: Language;
  onSave: (updatedUser: User) => Promise<void> | void;
}

const NEPAL_DISTRICTS = [
  'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kaski (Pokhara)', 'Chitwan',
  'Morang (Biratnagar)', 'Jhapa', 'Rupandehi (Butwal)', 'Dhanusha (Janakpur)',
  'Parsa (Birgunj)', 'Sunsari (Dharan)', 'Banke (Nepalgunj)', 'Surkhet',
  'Kailali (Dhangadhi)', 'Solukhumbu (Everest)', 'Mustang', 'Manang', 'Gorkha',
  'Makwanpur (Hetauda)', 'Kavrepalanchok'
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  language,
  onSave
}) => {
  const [fullName, setFullName] = useState(currentUser.full_name || '');
  const [bloodGroup, setBloodGroup] = useState(currentUser.blood_group || 'O+');
  const [age, setAge] = useState((currentUser.age || 28).toString());
  const [gender, setGender] = useState(currentUser.gender || 'Male');
  const [district, setDistrict] = useState(currentUser.district || 'Kathmandu');
  const [address, setAddress] = useState(currentUser.address || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [emergencyPhone, setEmergencyPhone] = useState(currentUser.emergency_contact || '+977-9841234567');
  const [allergies, setAllergies] = useState(currentUser.allergies?.join(', ') || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFullName(currentUser.full_name || '');
      setBloodGroup(currentUser.blood_group || 'O+');
      setAge((currentUser.age || 28).toString());
      setGender(currentUser.gender || 'Male');
      setDistrict(currentUser.district || 'Kathmandu');
      setAddress(currentUser.address || '');
      setPhone(currentUser.phone || '');
      setEmail(currentUser.email || '');
      setEmergencyPhone(currentUser.emergency_contact || '+977-9841234567');
      setAllergies(currentUser.allergies?.join(', ') || '');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError(language === 'np' ? 'कृपया पूरा नाम प्रविष्ट गर्नुहोस्।' : 'Please enter your full legal name.');
      return;
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      setError(language === 'np' ? 'कृपया मान्य उमेर प्रविष्ट गर्नुहोस्।' : 'Please enter a valid age between 1 and 120.');
      return;
    }

    if (!phone.trim()) {
      setError(language === 'np' ? 'कृपया सम्पर्क फोन नम्बर प्रविष्ट गर्नुहोस्।' : 'Please provide a valid contact number.');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');

    const updatedUser: User = {
      ...currentUser,
      full_name: fullName.trim(),
      blood_group: bloodGroup,
      age: parsedAge,
      gender: gender,
      district: district.trim() || 'Kathmandu',
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      emergency_contact: emergencyPhone.trim(),
      allergies: allergies
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)
    };

    try {
      // 1. Call parent state updater
      await onSave(updatedUser);

      // 2. Persist to authoritative server-side ACID JSON database
      await api.updateUser(updatedUser.id, updatedUser);

      setSuccess(true);
      triggerHaptic('success');
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 700);
    } catch (err: any) {
      console.warn('Error updating profile:', err);
      setError(err?.message || 'Failed to persist update to database. Please retry.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-slate-800 text-teal-400 border border-teal-500/20 flex items-center justify-center font-bold shadow-md shrink-0">
              <UserIcon className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white leading-tight">
                {language === 'np' ? 'स्वास्थ्य प्रोफाइल सम्पादन' : 'Edit Health Profile'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {language === 'np'
                  ? 'व्यक्तिगत विवरण तथा आपतकालीन सम्पर्क अद्यावधिक गर्नुहोस्'
                  : 'Update personal health dossier & emergency contact'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Database Badge */}
        <div className="mt-3.5 p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/50 flex items-center gap-2 text-xs text-teal-900 dark:text-teal-200">
          <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span className="font-semibold text-[11px]">
            {language === 'np'
              ? 'सुरक्षित डाटाबेस: सबै विवरणहरू गुप्तिकृत ढाँचामा भण्डारण गरिन्छ।'
              : 'ACID Persistent Database: Cryptographically sealed & tamper-proof.'}
          </span>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{language === 'np' ? 'प्रोफाइल सफलतापूर्वक सुरक्षित गरियो!' : 'Profile updated and saved to persistent database!'}</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              {language === 'np' ? 'पूरा नाम *' : 'Full Legal Name *'}
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nepal Parajuli"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                {language === 'np' ? 'रक्त समूह' : 'Blood Group'}
              </label>
              <div className="relative">
                <Droplets className="w-4 h-4 text-red-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                {language === 'np' ? 'उमेर' : 'Age'}
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                {language === 'np' ? 'लिङ्ग' : 'Gender'}
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="Male">{language === 'np' ? 'पुरुष (Male)' : 'Male'}</option>
                <option value="Female">{language === 'np' ? 'महिला (Female)' : 'Female'}</option>
                <option value="Other">{language === 'np' ? 'अन्य (Other)' : 'Other'}</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                {language === 'np' ? 'जिल्ला' : 'District'}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  list="nepal-districts-list"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Kathmandu"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <datalist id="nepal-districts-list">
                  {NEPAL_DISTRICTS.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                {language === 'np' ? 'सम्पर्क फोन *' : 'Contact Phone *'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+977-98XXXXXXXX"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                {language === 'np' ? 'आपतकालीन सम्पर्क (SOS)' : 'Emergency SOS Phone'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+977-98XXXXXXXX"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              {language === 'np' ? 'इमेल (वैकल्पिक)' : 'Email Address (Optional)'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@xenonhealth.org.np"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              {language === 'np' ? 'स्थानीय ठेगाना (टोल / सडक)' : 'Street / Locality Address'}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. New Baneshwor, Ward 10"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              {language === 'np' ? 'क्लिनिकल एलर्जीहरू (कमाले छुट्याउनुहोस्)' : 'Known Drug / Clinical Allergies'}
            </label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Penicillin, Aspirin, Pollen, Peanuts"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              {language === 'np'
                ? 'औषधि सिफारिस गर्दा यी एलर्जीहरू स्वतः जाँच गरिन्छ।'
                : 'Checked automatically against medication contraindications.'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-all cursor-pointer"
            >
              {language === 'np' ? 'रद्द गर्नुहोस्' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? (language === 'np' ? 'सुरक्षित गर्दै...' : 'Saving to Database...')
                  : (language === 'np' ? 'परिवर्तन सुरक्षित गर्नुहोस्' : 'Save Changes')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
