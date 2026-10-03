export type Language = 'en' | 'np';

export type TabType =
  | 'dashboard'
  | 'doctors'
  | 'xenon'
  | 'emergency'
  | 'hospitals'
  | 'records'
  | 'developer'
  | 'offlineGuide'
  | 'labReports';

export interface Doctor {
  id: string;
  name: string;
  nmc_number: string;
  specialty: string;
  specialty_np: string;
  hospital_id: string;
  hospital: string;
  degrees: string;
  experience_years: number;
  fee_npr: number;
  available: boolean;
  rating: number;
  reviews_count?: number;
  languages: string[];
  schedule: string;
  pin?: string;
}

export interface Hospital {
  id: string;
  name: string;
  name_np: string;
  address: string;
  district: string;
  phone: string;
  emergency: string;
  email: string;
  website?: string;
  type: 'Private' | 'Government' | 'Teaching' | 'Non-Profit';
  beds: number;
  icu: boolean;
  specialties: string[];
  open_247: boolean;
  rating: number;
  description: string;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  appointment_id?: string | null;
  patient_username: string;
  patient_name: string;
  doctor_id?: string;
  doctor_name: string;
  specialty: string;
  date: string;
  diagnosis: string;
  vitals?: {
    bp?: string;
    pulse?: string;
    weight_kg?: number;
    sp_o2?: string;
  };
  medicines: Medicine[];
  lab_investigations?: string[];
  lifestyle_advice: string;
  follow_up_date: string;
}

export interface Appointment {
  id: string;
  patient_username: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  hospital: string;
  date: string;
  time: string;
  type: 'Video Consultation' | 'In-Person OPD' | string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
  symptoms: string;
  fee_npr: number;
  meeting_link?: string | null;
  synced?: boolean;
  queuedAt?: string;
}

export interface ChatMessage {
  id?: string;
  sender: 'user' | 'hospital';
  text: string;
  time: string;
  synced?: boolean;
  hospital_id?: string;
  hospital_name?: string;
  queued_at?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isSyncing: boolean;
  pendingAppointmentsCount: number;
  pendingMessagesCount: number;
  lastSyncedAt: string | null;
  serviceWorkerActive: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: 'Self' | 'Father' | 'Mother' | 'Spouse' | 'Son' | 'Daughter' | 'Grandfather' | 'Grandmother' | 'Other';
  age: number;
  gender: string;
  blood_group: string;
  chronic_conditions?: string[];
  allergies?: string[];
  vaccinations?: {
    name: string;
    date: string;
    status: 'Completed' | 'Pending' | 'Due Soon';
  }[];
  emergency_notes?: string;
}

export interface LabBiomarker {
  parameter: string;
  value: number | string;
  unit: string;
  reference_range: string;
  status: 'Normal' | 'High' | 'Low' | 'Critical';
}

export interface LabReport {
  id: string;
  patient_name: string;
  family_member_id?: string;
  test_name: string;
  test_date: string;
  lab_name: string;
  doctor_ref?: string;
  status: 'Completed' | 'Processing';
  biomarkers: LabBiomarker[];
  ai_summary: string;
  ai_summary_np?: string;
  file_url?: string;
}

export interface EmergencyContact {
  name: string;
  name_np: string;
  number: string;
  desc: string;
  category?: 'air-ambulance' | 'drone-delivery' | 'national-helpline' | 'mental-health' | 'police';
  badge?: string;
  icon?: string;
  available?: boolean;
  unavailableReason?: string;
}

export interface UserVitals {
  bp?: string;
  blood_sugar?: string;
  sp_o2?: string;
  heart_rate?: string;
  weight_kg?: string;
  temperature?: string;
  height_cm?: string;
  bmi?: string;
  last_updated?: string;
}

export interface UserHealthRecord {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  category: 'Prescription' | 'Lab Report' | 'Vaccination' | 'Discharge Summary' | 'Vitals Log' | 'X-Ray / Scan' | 'Other';
  date: string;
  file_name?: string;
  file_size?: string;
  file_type?: string;
  file_data_url?: string;
  notes?: string;
  vitals?: UserVitals;
  ai_insights?: string;
  tags?: string[];
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  role: 'patient' | 'doctor' | 'developer';
  full_name: string;
  phone: string;
  email: string;
  password?: string;
  blood_group?: string;
  age?: number;
  gender?: string;
  address?: string;
  district?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  emergency_contact?: string;
  nmc_number?: string;
  specialty?: string;
  hospital?: string;
  degrees?: string;
  created_at?: string;
  vitals?: UserVitals;
  status?: 'active' | 'suspended' | 'pending_verification';
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actorType: 'patient' | 'doctor' | 'admin' | 'system';
  actorName: string;
  action: string;
  category: 'appointment' | 'vitals' | 'prescription' | 'security' | 'status' | 'broadcast';
  details: string;
  status: 'completed' | 'pending' | 'flagged';
  targetEmail?: string;
}

