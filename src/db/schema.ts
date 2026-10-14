import { pgTable, serial, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (maps Firebase UID to application users)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  fullName: text('full_name').notNull().default(''),
  role: text('role').notNull().default('patient'), // 'patient' | 'doctor' | 'admin'
  phone: text('phone').default(''),
  bloodGroup: text('blood_group').default(''),
  dateOfBirth: text('date_of_birth').default(''),
  emergencyContact: text('emergency_contact').default(''),
  address: text('address').default(''),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Doctors table
export const doctors = pgTable('doctors', {
  id: serial('id').primaryKey(),
  doctorId: text('doctor_id').notNull().unique(), // Custom ID e.g. DOC-KATH-001
  userId: text('user_id').references(() => users.uid),
  name: text('name').notNull(),
  email: text('email').notNull(),
  specialty: text('specialty').notNull(),
  nmcNumber: text('nmc_number').notNull(),
  hospital: text('hospital').notNull(),
  experience: text('experience').default(''),
  qualification: text('qualification').default(''),
  consultationFee: integer('consultation_fee').default(500),
  rating: text('rating').default('4.8'),
  available: boolean('available').notNull().default(true),
  avatar: text('avatar').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Hospitals table (for dynamic hospital management)
export const hospitals = pgTable('hospitals', {
  id: text('id').primaryKey(), // hosp_001, etc.
  name: text('name').notNull(),
  district: text('district').notNull().default('Kathmandu'),
  province: text('province').notNull().default('Bagmati'),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  emergencyPhone: text('emergency_phone').notNull(),
  lat: text('lat').notNull(),
  lng: text('lng').notNull(),
  availableBeds: integer('available_beds').notNull().default(10),
  icuBeds: integer('icu_beds').notNull().default(2),
  oxygenAvailable: boolean('oxygen_available').notNull().default(true),
  bloodBank: boolean('blood_bank').notNull().default(true),
  heliPad: boolean('heli_pad').notNull().default(false),
  verified: boolean('verified').notNull().default(true),
  services: jsonb('services').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Appointments table
export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  appointmentId: text('appointment_id').notNull().unique(),
  patientUid: text('patient_uid').notNull(),
  patientName: text('patient_name').notNull(),
  doctorId: text('doctor_id').notNull(),
  doctorName: text('doctor_name').notNull(),
  hospitalName: text('hospital_name').default(''),
  date: text('date').notNull(),
  time: text('time').notNull(),
  type: text('type').notNull().default('teleconsultation'), // teleconsultation | in_person | emergency
  status: text('status').notNull().default('confirmed'), // pending | confirmed | completed | cancelled
  reason: text('reason').default(''),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Vitals table
export const vitals = pgTable('vitals', {
  id: serial('id').primaryKey(),
  patientUid: text('patient_uid').notNull(),
  timestamp: text('timestamp').notNull(),
  heartRate: integer('heart_rate'),
  bloodPressureSys: integer('blood_pressure_sys'),
  bloodPressureDia: integer('blood_pressure_dia'),
  spo2: integer('spo2'),
  temperature: text('temperature'),
  respiratoryRate: integer('respiratory_rate'),
  bloodSugar: integer('blood_sugar'),
  notes: text('notes').default(''),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});

// Clinical Patient Records (prescriptions, labs, diagnoses)
export const clinicalRecords = pgTable('clinical_records', {
  id: serial('id').primaryKey(),
  recordId: text('record_id').notNull().unique(),
  patientUid: text('patient_uid').notNull(),
  doctorUid: text('doctor_uid').default(''),
  recordType: text('record_type').notNull(), // diagnosis | prescription | lab_result | discharge_summary
  title: text('title').notNull(),
  doctorName: text('doctor_name').default(''),
  diagnosis: text('diagnosis').default(''),
  prescription: text('prescription').default(''),
  labResults: text('lab_results').default(''),
  date: text('date').notNull(),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Secure Audit Logs (HIPAA / P0-P2 Security Checklist Compliance)
export const securityAuditLogs = pgTable('security_audit_logs', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  action: text('action').notNull(), // e.g. AUTH_LOGIN, VIEW_RECORD, UPDATE_PATIENT, AI_CONSULTATION, EXPORT_DATA
  actorUid: text('actor_uid').default('anonymous'),
  actorEmail: text('actor_email').default('unknown'),
  actorRole: text('actor_role').default('patient'),
  targetResource: text('target_resource').notNull(),
  ipAddress: text('ip_address').default('127.0.0.1'),
  status: text('status').notNull().default('SUCCESS'), // SUCCESS | DENIED | ERROR
  details: text('details').default(''),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
  vitals: many(vitals),
  clinicalRecords: many(clinicalRecords),
}));
