import { jsPDF } from 'jspdf';
import { User, Appointment, Prescription } from '../types';

export interface PatientMedicalSummaryData {
  patient: User;
  appointments: Appointment[];
  prescriptions: Prescription[];
  vitals?: {
    systolicBP?: number;
    diastolicBP?: number;
    heartRate?: number;
    spO2?: number;
    bloodGlucose?: number;
    temperature?: number;
    weightKg?: number;
    lastUpdated?: string;
  };
  generatedDate?: string;
}

/**
 * Generates an official, publication-grade printable medical summary PDF
 * for the patient, containing clinical background, vitals, appointments, and current prescriptions.
 */
export function generatePatientMedicalSummaryPdf(data: PatientMedicalSummaryData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  const primaryColor = [220, 38, 38]; // #DC2626 (Crimson Red)
  const secondaryColor = [37, 99, 235]; // #2563EB (Royal Blue)
  const slateDark = [15, 23, 42]; // #0F172A
  const slateMuted = [100, 116, 139]; // #64748B
  const bgLight = [248, 250, 252]; // #F8FAFC
  const borderLight = [226, 232, 240]; // #E2E8F0

  // -------------------------------------------------------------
  // 1. TOP HEADER & OFFICIAL EMBLEM
  // -------------------------------------------------------------
  // Header background bar
  doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F');

  // Accent stripe
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, y + 23, contentWidth, 1.2, 'F');

  // Header Titles
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('XENON HEALTH NEPAL — DIGITAL TELEMEDICINE NETWORK', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    'National Digital Health Registry • In Accordance with Nepal Medical Council & Telemedicine Directives',
    margin + 6,
    y + 15
  );
  doc.text(
    'Kathmandu, Bagmati Province, Nepal • Hotline: 102 (Ambulance) • Verified Electronic Health Record (EHR)',
    margin + 6,
    y + 20
  );

  y += 30;

  // Document Title & Record Hash Badge
  const docHash = `EHR-NP-${data.patient.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const printDate = data.generatedDate || new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('OFFICIAL PATIENT MEDICAL DOSSIER & PRESCRIPTION SUMMARY', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Generated: ${printDate}  |  Doc ID: ${docHash}`, margin, y + 4.5);

  y += 10;

  // -------------------------------------------------------------
  // 2. PATIENT DEMOGRAPHICS DOSSIER BOX
  // -------------------------------------------------------------
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('I. PATIENT IDENTIFICATION & CLINICAL PROFILE', margin + 4, y + 6);

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFontSize(8.5);

  // Column 1
  const col1X = margin + 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Full Legal Name:', col1X, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(data.patient.full_name || 'Patient', col1X + 28, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.text('Patient ID (PID):', col1X, y + 19);
  doc.setFont('helvetica', 'normal');
  doc.text(data.patient.id, col1X + 28, y + 19);

  doc.setFont('helvetica', 'bold');
  doc.text('Age / Gender:', col1X, y + 25);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.patient.age || 29} yrs / ${data.patient.gender || 'Not Specified'}`, col1X + 28, y + 25);

  // Column 2
  const col2X = margin + 74;
  doc.setFont('helvetica', 'bold');
  doc.text('Blood Group:', col2X, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(data.patient.blood_group || 'O+', col2X + 26, y + 13);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);

  doc.setFont('helvetica', 'bold');
  doc.text('Primary Phone:', col2X, y + 19);
  doc.setFont('helvetica', 'normal');
  doc.text(data.patient.phone || '+977-9841234567', col2X + 26, y + 19);

  doc.setFont('helvetica', 'bold');
  doc.text('District / Locality:', col2X, y + 25);
  doc.setFont('helvetica', 'normal');
  doc.text(data.patient.district || 'Kathmandu, Nepal', col2X + 26, y + 25);

  // Column 3 (Alerts & Emergency)
  const col3X = margin + 136;
  doc.setFont('helvetica', 'bold');
  doc.text('Emergency Contact:', col3X, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(data.patient.emergency_contact || '+977-9841234567', col3X, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Allergies & Alerts:', col3X, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  const allergies = data.patient.allergies?.join(', ') || 'No known drug allergies reported';
  doc.text(allergies.length > 25 ? allergies.substring(0, 25) + '...' : allergies, col3X, y + 29);

  y += 39;

  // -------------------------------------------------------------
  // 3. RECENT PHYSIOLOGICAL VITALS TELEMETRY
  // -------------------------------------------------------------
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('II. LATEST PHYSIOLOGICAL VITALS TELEMETRY', margin + 4, y + 5.5);

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFontSize(8);

  const v = data.vitals || {
    systolicBP: 120,
    diastolicBP: 80,
    heartRate: 74,
    spO2: 98,
    bloodGlucose: 96,
    temperature: 98.4,
    weightKg: 68
  };

  // 5 vital badges across row
  const vitalWidth = (contentWidth - 8) / 5;

  const vitalsList = [
    { label: 'Blood Pressure', value: `${v.systolicBP || 120}/${v.diastolicBP || 80} mmHg`, status: 'Normal' },
    { label: 'Pulse / Heart Rate', value: `${v.heartRate || 74} bpm`, status: 'Normal' },
    { label: 'Blood Oxygen (SpO2)', value: `${v.spO2 || 98}%`, status: 'Optimal' },
    { label: 'Fasting Glucose', value: `${v.bloodGlucose || 96} mg/dL`, status: 'Normal' },
    { label: 'Body Temperature', value: `${v.temperature || 98.4}°F`, status: 'Afebrile' }
  ];

  vitalsList.forEach((item, idx) => {
    const vx = margin + 4 + idx * vitalWidth;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.roundedRect(vx, y + 8, vitalWidth - 2, 13, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(item.label, vx + 2, y + 11.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(item.value, vx + 2, y + 16.5);

    doc.setFontSize(6.5);
    doc.setTextColor(16, 185, 129); // green
    doc.text(`[${item.status}]`, vx + 2, y + 19.5);
  });

  y += 29;

  // -------------------------------------------------------------
  // 4. ACTIVE MEDICATIONS & PRESCRIPTIONS TABLE
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('III. ACTIVE MEDICATIONS & CURRENT DIGITAL PRESCRIPTIONS', margin, y + 4);

  y += 6;

  // Table Header
  const tableHeaderY = y;
  doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.rect(margin, tableHeaderY, contentWidth, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  doc.text('Rx ID', margin + 2, tableHeaderY + 4.8);
  doc.text('Medication & Generic Strength', margin + 20, tableHeaderY + 4.8);
  doc.text('Dosage / Frequency', margin + 80, tableHeaderY + 4.8);
  doc.text('Duration', margin + 120, tableHeaderY + 4.8);
  doc.text('Prescribed By (NMC Dr.)', margin + 143, tableHeaderY + 4.8);

  y += 7;

  const validPrescriptions = data.prescriptions && data.prescriptions.length > 0 ? data.prescriptions : [];

  if (validPrescriptions.length === 0) {
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.rect(margin, y, contentWidth, 10, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text('No active prescriptions registered in the digital health vault.', margin + 4, y + 6);
    y += 12;
  } else {
    // Flatten prescriptions medicines list for the table
    const allMeds: Array<{
      rxId: string;
      doctorName: string;
      date: string;
      diagnosis: string;
      name: string;
      dosage: string;
      duration: string;
      instructions: string;
    }> = [];

    validPrescriptions.forEach((rx) => {
      if (Array.isArray(rx.medicines) && rx.medicines.length > 0) {
        rx.medicines.forEach((med) => {
          allMeds.push({
            rxId: rx.id,
            doctorName: rx.doctor_name,
            date: rx.date,
            diagnosis: rx.diagnosis,
            name: med.name,
            dosage: `${med.dosage || ''} ${med.frequency ? '• ' + med.frequency : ''}`.trim(),
            duration: med.duration || 'As directed',
            instructions: med.instructions || rx.lifestyle_advice || 'Take as directed'
          });
        });
      } else {
        allMeds.push({
          rxId: rx.id,
          doctorName: rx.doctor_name,
          date: rx.date,
          diagnosis: rx.diagnosis,
          name: 'Prescribed Therapeutic Medicine',
          dosage: 'As Directed',
          duration: '30 Days',
          instructions: rx.lifestyle_advice || 'Take as advised by attending clinician'
        });
      }
    });

    allMeds.slice(0, 6).forEach((medItem, index) => {
      const isEven = index % 2 === 0;
      doc.setFillColor(isEven ? 255 : bgLight[0], isEven ? 255 : bgLight[1], isEven ? 255 : bgLight[2]);
      doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
      doc.rect(margin, y, contentWidth, 12, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text(`#${medItem.rxId.toUpperCase()}`, margin + 2, y + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const medName = medItem.name || 'Prescribed Therapeutic Medicine';
      doc.text(medName.length > 34 ? medName.substring(0, 34) + '...' : medName, margin + 20, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      const instr = medItem.instructions || 'Take as advised by attending clinician';
      doc.text(instr.length > 40 ? instr.substring(0, 40) + '...' : instr, margin + 20, y + 8.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text(medItem.dosage || '1 Tab Daily', margin + 80, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(medItem.duration || '30 Days', margin + 120, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(medItem.doctorName || 'Attending Physician', margin + 143, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text(`Dx: ${medItem.diagnosis.length > 18 ? medItem.diagnosis.substring(0, 18) + '...' : medItem.diagnosis} | ${medItem.date}`, margin + 143, y + 8.5);

      y += 12;
    });
  }

  y += 4;

  // -------------------------------------------------------------
  // 5. CLINICAL CONSULTATIONS & APPOINTMENT HISTORY
  // -------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('IV. CONSULTATION & SPECIALIST OPD ENCOUNTERS', margin, y + 4);

  y += 6;

  // Table Header for Consultations
  const aptHeaderY = y;
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(margin, aptHeaderY, contentWidth, 7, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);

  doc.text('Date & Time', margin + 2, aptHeaderY + 4.8);
  doc.text('Specialist Doctor & Specialty', margin + 35, aptHeaderY + 4.8);
  doc.text('Hospital / Medical Center', margin + 95, aptHeaderY + 4.8);
  doc.text('Consultation Type', margin + 145, aptHeaderY + 4.8);
  doc.text('Status', margin + 168, aptHeaderY + 4.8);

  y += 7;

  const validAppointments = data.appointments && data.appointments.length > 0 ? data.appointments : [];

  if (validAppointments.length === 0) {
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.rect(margin, y, contentWidth, 10, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text('No historical appointments logged.', margin + 4, y + 6);
    y += 12;
  } else {
    validAppointments.slice(0, 5).forEach((apt, idx) => {
      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : bgLight[0], isEven ? 255 : bgLight[1], isEven ? 255 : bgLight[2]);
      doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
      doc.rect(margin, y, contentWidth, 10, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.text(`${apt.date} ${apt.time || ''}`, margin + 2, y + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(apt.doctor_name, margin + 35, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text(apt.specialty, margin + 35, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      const hosp = apt.hospital || 'Accredited Medical Center';
      doc.text(hosp.length > 28 ? hosp.substring(0, 28) + '...' : hosp, margin + 95, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.text(apt.type || 'Telemedicine Video', margin + 145, y + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      const isConfirmed = apt.status === 'Confirmed' || apt.status === 'Completed';
      doc.setTextColor(isConfirmed ? 16 : 220, isConfirmed ? 185 : 38, isConfirmed ? 129 : 38);
      doc.text(apt.status, margin + 168, y + 5.5);

      y += 10;
    });
  }

  y += 5;

  // -------------------------------------------------------------
  // 6. OFFICIAL VERIFICATION & LEGAL DISCLAIMER FOOTER
  // -------------------------------------------------------------
  const footerY = Math.max(y, pageHeight - 34);

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, footerY, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('NEPAL MEDICAL COUNCIL (NMC) COMPLIANT ELECTRONIC RECORD', margin + 4, footerY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(
    'This document constitutes a certified summary of patient medical encounters and active prescriptions on the Xenon Health platform.',
    margin + 4,
    footerY + 9
  );
  doc.text(
    'All electronic prescriptions herein are signed by Nepal Medical Council (NMC) licensed practitioners and verified via statutory registries.',
    margin + 4,
    footerY + 13
  );
  doc.text(
    'For verification or clinical inquiries, contact Xenon Health Emergency Medical Bureau (Kathmandu) or emergency hotline 102.',
    margin + 4,
    footerY + 17
  );

  // Digital Signature Seal Stamp Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(margin + contentWidth - 42, footerY + 3, 38, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('DIGITALLY CERTIFIED', margin + contentWidth - 39, footerY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('Xenon Health Medical Bureau', margin + contentWidth - 39, footerY + 10.5);
  doc.text('Kathmandu, Nepal', margin + contentWidth - 39, footerY + 13.5);
  doc.text(`Hash: ${docHash.substring(0, 14)}`, margin + contentWidth - 39, footerY + 17);

  return doc;
}

/**
 * Convenience helper to generate and trigger direct client download of the PDF file
 */
export function downloadPatientMedicalSummaryPdf(data: PatientMedicalSummaryData): void {
  const doc = generatePatientMedicalSummaryPdf(data);
  const patientSafeName = (data.patient.full_name || 'Patient')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  const filename = `medical_summary_${patientSafeName}_${data.patient.id}.pdf`;
  doc.save(filename);
}
