import { db } from './index.ts';
import {
  hospitals,
  appointments,
  vitals,
  clinicalRecords,
  doctors,
  securityAuditLogs,
} from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import fs from 'node:fs';
import path from 'node:path';

// Seed initial hospitals if database table is empty
export async function seedHospitalsIfEmpty() {
  try {
    const existing = await db.select({ id: hospitals.id }).from(hospitals).limit(1);
    if (existing.length === 0) {
      const seedFile = path.resolve(process.cwd(), 'data/hospitals-seed.json');
      if (fs.existsSync(seedFile)) {
        const seedData = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));
        for (const h of seedData) {
          await db
            .insert(hospitals)
            .values({
              id: h.id,
              name: h.name,
              district: h.district || 'Kathmandu',
              province: h.province || 'Bagmati',
              address: h.address || '',
              phone: h.phone || '',
              emergencyPhone: h.emergencyPhone || h.phone || '',
              lat: String(h.lat || h.coordinates?.lat || '27.7'),
              lng: String(h.lng || h.coordinates?.lng || '85.3'),
              availableBeds: h.availableBeds || 12,
              icuBeds: h.icuBeds || 3,
              oxygenAvailable: h.oxygenAvailable ?? true,
              bloodBank: h.bloodBank ?? true,
              heliPad: h.heliPad ?? false,
              verified: true,
              services: h.services || ['Emergency', 'ICU', 'Telemedicine'],
            })
            .onConflictDoNothing();
        }
      }
    }
  } catch (err) {
    console.warn('Initial hospital seed note:', err);
  }
}

// Hospitals CRUD
export async function getAllHospitals() {
  try {
    await seedHospitalsIfEmpty();
    return await db.select().from(hospitals);
  } catch (error: any) {
    console.error('getAllHospitals error:', error);
    throw new Error('Failed to query hospitals from database', { cause: error });
  }
}

export async function insertHospital(data: any) {
  try {
    const res = await db
      .insert(hospitals)
      .values({
        id: data.id || `hosp_${Date.now()}`,
        name: data.name,
        district: data.district || 'Kathmandu',
        province: data.province || 'Bagmati',
        address: data.address || '',
        phone: data.phone || '',
        emergencyPhone: data.emergencyPhone || data.phone || '',
        lat: String(data.lat || data.coordinates?.lat || '27.7'),
        lng: String(data.lng || data.coordinates?.lng || '85.3'),
        availableBeds: data.availableBeds ? Number(data.availableBeds) : 10,
        icuBeds: data.icuBeds ? Number(data.icuBeds) : 2,
        oxygenAvailable: data.oxygenAvailable ?? true,
        bloodBank: data.bloodBank ?? true,
        heliPad: data.heliPad ?? false,
        verified: true,
        services: data.services || ['Emergency', 'General Ward'],
      })
      .returning();
    return res[0];
  } catch (error: any) {
    console.error('insertHospital error:', error);
    throw new Error('Failed to insert hospital into database', { cause: error });
  }
}

export async function updateHospitalById(id: string, data: any) {
  try {
    const res = await db
      .update(hospitals)
      .set({
        name: data.name,
        district: data.district,
        address: data.address,
        phone: data.phone,
        emergencyPhone: data.emergencyPhone,
        availableBeds: data.availableBeds ? Number(data.availableBeds) : undefined,
        icuBeds: data.icuBeds ? Number(data.icuBeds) : undefined,
        oxygenAvailable: data.oxygenAvailable,
        bloodBank: data.bloodBank,
      })
      .where(eq(hospitals.id, id))
      .returning();
    return res[0];
  } catch (error: any) {
    console.error('updateHospitalById error:', error);
    throw new Error('Failed to update hospital in database', { cause: error });
  }
}

export async function deleteHospitalById(id: string) {
  try {
    await db.delete(hospitals).where(eq(hospitals.id, id));
    return { success: true, id };
  } catch (error: any) {
    console.error('deleteHospitalById error:', error);
    throw new Error('Failed to delete hospital from database', { cause: error });
  }
}

// Appointments
export async function getAppointmentsForPatient(patientUid: string) {
  try {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.patientUid, patientUid))
      .orderBy(desc(appointments.createdAt));
  } catch (error: any) {
    console.error('getAppointmentsForPatient error:', error);
    throw new Error('Failed to fetch appointments', { cause: error });
  }
}

export async function insertAppointment(data: any) {
  try {
    const res = await db
      .insert(appointments)
      .values({
        appointmentId: data.appointmentId || `apt_${Date.now()}`,
        patientUid: data.patientUid,
        patientName: data.patientName || 'Anonymous Patient',
        doctorId: data.doctorId || 'doc_general',
        doctorName: data.doctorName || 'Attending Physician',
        hospitalName: data.hospitalName || 'Nepal Telemed Center',
        date: data.date,
        time: data.time,
        type: data.type || 'teleconsultation',
        status: data.status || 'confirmed',
        reason: data.reason || '',
        notes: data.notes || '',
      })
      .returning();
    return res[0];
  } catch (error: any) {
    console.error('insertAppointment error:', error);
    throw new Error('Failed to save appointment', { cause: error });
  }
}

// Vitals
export async function getVitalsForPatient(patientUid: string) {
  try {
    return await db
      .select()
      .from(vitals)
      .where(eq(vitals.patientUid, patientUid))
      .orderBy(desc(vitals.recordedAt));
  } catch (error: any) {
    console.error('getVitalsForPatient error:', error);
    throw new Error('Failed to retrieve patient vitals', { cause: error });
  }
}

export async function insertVital(data: any) {
  try {
    const res = await db
      .insert(vitals)
      .values({
        patientUid: data.patientUid,
        timestamp: data.timestamp || new Date().toISOString(),
        heartRate: data.heartRate ? Number(data.heartRate) : null,
        bloodPressureSys: data.bloodPressureSys ? Number(data.bloodPressureSys) : null,
        bloodPressureDia: data.bloodPressureDia ? Number(data.bloodPressureDia) : null,
        spo2: data.spo2 ? Number(data.spo2) : null,
        temperature: data.temperature ? String(data.temperature) : null,
        respiratoryRate: data.respiratoryRate ? Number(data.respiratoryRate) : null,
        bloodSugar: data.bloodSugar ? Number(data.bloodSugar) : null,
        notes: data.notes || '',
      })
      .returning();
    return res[0];
  } catch (error: any) {
    console.error('insertVital error:', error);
    throw new Error('Failed to save vital record', { cause: error });
  }
}

// Doctors
export async function getAllDoctors() {
  try {
    return await db.select().from(doctors);
  } catch (error: any) {
    console.error('getAllDoctors error:', error);
    throw new Error('Failed to query doctors', { cause: error });
  }
}

export async function insertDoctor(data: any) {
  try {
    const res = await db
      .insert(doctors)
      .values({
        doctorId: data.doctorId || `DOC-${Date.now()}`,
        name: data.name,
        email: data.email,
        specialty: data.specialty,
        nmcNumber: data.nmcNumber,
        hospital: data.hospital,
        experience: data.experience || '5+ years',
        qualification: data.qualification || 'MBBS, MD',
        consultationFee: data.consultationFee ? Number(data.consultationFee) : 500,
        rating: data.rating ? String(data.rating) : '4.8',
        available: data.available ?? true,
        avatar: data.avatar || '',
      })
      .returning();
    return res[0];
  } catch (error: any) {
    console.error('insertDoctor error:', error);
    throw new Error('Failed to save doctor', { cause: error });
  }
}

// Security Audit Logs
export async function getAuditLogs(limitCount = 50) {
  try {
    return await db
      .select()
      .from(securityAuditLogs)
      .orderBy(desc(securityAuditLogs.timestamp))
      .limit(limitCount);
  } catch (error: any) {
    console.error('getAuditLogs error:', error);
    throw new Error('Failed to query security logs', { cause: error });
  }
}
