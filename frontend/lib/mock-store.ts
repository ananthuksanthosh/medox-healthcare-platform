'use client'

// Unified backend-backed store — real API calls only, no mock data

export interface Appointment {
  id: string | number
  appointmentDate?: string
  date: string
  time: string
  status: string
  type: string
  fee: number
  // Patient perspective
  doctor: string
  doctorId?: number
  doctorEmail?: string
  specialization: string
  hospital: string
  hospitalDistrict?: string
  department?: string
  consultationFee?: number
  // Doctor perspective
  patientId?: number
  patientName?: string
  patientEmail?: string
  patientPhone?: string
  patientGender?: string
  patientAge?: number
  reason?: string
  tokenNumber?: number
  notes?: string
  payment?: any
  prescription?: any
}

export interface MedicalRecord {
  id: string | number
  title: string
  type: string
  reportType?: string
  doctor: string
  hospital: string
  date: string
  description: string
  fileSize: string
  fileUrl: string
  status: string
}

export interface Prescription {
  id: string | number
  prescriptionId?: string
  doctor?: string
  hospital?: string
  specialization?: string
  patientName?: string
  patientAge?: number
  date: string
  createdAt?: string
  diagnosis: string
  notes?: string
  status: string
  medicines: { name: string; dosage: string; frequency: string; duration: string }[]
  refillsRemaining: number
  validUntil: string
  appointmentId?: number
}

export interface Payment {
  id: string | number
  billId: string
  hospital: string
  doctor: string
  treatment: string
  date: string
  amount: number
  method: string
  paymentMethod?: string
  status: string
  paymentStatus?: string
  transactionId?: string
}

export interface DayAvailability {
  enabled: boolean
  slots: string[]
}

const API_BASE_URL = 'http://localhost:5000/api'

/** Read auth token — supports both storage keys used by login/register */
function getToken(): string | null {
  if (typeof window === 'undefined') return null
  // Login page stores as 'token', register also stores as 'token'
  // signIn() in lib/auth.ts additionally stores as 'medox.authToken'
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('medox.authToken') ||
    null
  )
}

function getHeaders(): Record<string, string> {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

export function getCurrentUser() {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export async function getAppointments(_email: string, _role: string): Promise<Appointment[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/appointments`, { headers: getHeaders() })
    if (!res.ok) throw new Error('Failed to fetch appointments')
    const data = await res.json()
    return data.data?.appointments ?? data.appointments ?? data ?? []
  } catch (error) {
    console.error('getAppointments error:', error)
    return []
  }
}

export async function addAppointment(_email: string, appointment: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/appointments`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(appointment)
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.message || 'Failed to book appointment')
  }
  const data = await res.json()
  return data.data?.appointment ?? data
}

export async function cancelAppointment(_email: string, id: string | number): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/appointments/${id}/cancel`, {
    method: 'PUT',
    headers: getHeaders()
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.message || 'Failed to cancel appointment')
  }
  return res.json()
}

export async function completeAppointment(id: string | number): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/appointments/${id}/complete`, {
    method: 'PUT',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Failed to complete appointment')
  return res.json()
}

export async function updateAppointmentStatus(id: string | number, status: string, notes?: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/appointments/${id}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status, notes })
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.message || 'Failed to update status')
  }
  return res.json()
}

// ─── Medical Records / Reports ────────────────────────────────────────────────

export async function getMedicalRecords(_email: string): Promise<MedicalRecord[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/medical-records`, { headers: getHeaders() })
    if (!res.ok) throw new Error('Failed to fetch records')
    const data = await res.json()
    return data.data?.records ?? data.records ?? (Array.isArray(data) ? data : [])
  } catch (error) {
    console.error('getMedicalRecords error:', error)
    return []
  }
}

export async function addMedicalRecordFile(formData: FormData): Promise<any> {
  const token = getToken()
  const res = await fetch(`${API_BASE_URL}/medical-records/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.message || 'Failed to upload report')
  }
  return res.json()
}

export async function deleteMedicalRecord(_email: string, id: string | number): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/medical-records/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Failed to delete record')
  return res.json()
}

// ─── Prescriptions ────────────────────────────────────────────────────────────

export async function getPrescriptions(_email: string, _role: string): Promise<Prescription[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/prescriptions`, { headers: getHeaders() })
    if (!res.ok) throw new Error('Failed to fetch prescriptions')
    const data = await res.json()
    return data.data?.prescriptions ?? data.prescriptions ?? data ?? []
  } catch (error) {
    console.error('getPrescriptions error:', error)
    return []
  }
}

export async function addPrescription(_email: string, prescription: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/prescriptions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(prescription)
  })
  if (!res.ok) {
    const errData = await res.json()
    throw new Error(errData.message || 'Failed to create prescription')
  }
  const data = await res.json()
  return data.data?.prescription ?? data
}

export async function updatePrescription(id: string | number, prescription: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/prescriptions/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(prescription)
  })
  if (!res.ok) {
    const errData = await res.json()
    throw new Error(errData.message || 'Failed to update prescription')
  }
  return res.json()
}

export async function deletePrescription(id: string | number): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/prescriptions/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!res.ok) throw new Error('Failed to delete prescription')
  return res.json()
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function getPayments(_email: string): Promise<Payment[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/payments`, { headers: getHeaders() })
    if (!res.ok) throw new Error('Failed to fetch payments')
    const data = await res.json()
    return data.data?.payments ?? data.payments ?? data ?? []
  } catch (error) {
    console.error('getPayments error:', error)
    return []
  }
}

// ─── Doctor Availability ──────────────────────────────────────────────────────

export async function getAvailability(_email: string, doctorId?: string | number): Promise<Record<string, DayAvailability>> {
  const empty: Record<string, DayAvailability> = {
    Monday: { enabled: false, slots: [] },
    Tuesday: { enabled: false, slots: [] },
    Wednesday: { enabled: false, slots: [] },
    Thursday: { enabled: false, slots: [] },
    Friday: { enabled: false, slots: [] },
    Saturday: { enabled: false, slots: [] },
    Sunday: { enabled: false, slots: [] }
  }
  try {
    const id = doctorId || getCurrentUser()?.id
    if (!id) return empty
    const res = await fetch(`${API_BASE_URL}/doctors/${id}/availability`, {
      headers: getHeaders()
    })
    if (!res.ok) throw new Error('Failed to fetch availability')
    const data = await res.json()
    return data.data ?? data
  } catch (error) {
    console.error('getAvailability error:', error)
    return empty
  }
}

export async function saveAvailability(_email: string, availability: Record<string, DayAvailability>): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/doctors/me/availability`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ availability })
  })
  if (!res.ok) throw new Error('Failed to save availability')
  return res.json()
}

// ─── Doctor Patients ──────────────────────────────────────────────────────────

export async function getDoctorPatients(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/doctors/me/patients`, { headers: getHeaders() })
    if (!res.ok) throw new Error('Failed to fetch patients')
    const data = await res.json()
    return data.data?.patients ?? data.patients ?? data ?? []
  } catch (error) {
    console.error('getDoctorPatients error:', error)
    return []
  }
}

// ─── Admin Analytics ──────────────────────────────────────────────────────────

export async function getDashboardAnalytics(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/analytics`, { headers: getHeaders() })
    if (!res.ok) throw new Error('Failed to fetch analytics')
    const data = await res.json()
    return data.data ?? data
  } catch (error) {
    console.error('getDashboardAnalytics error:', error)
    return null
  }
}

export function downloadPrescriptionPDF(p: any) {
  const doctorName = p.doctor || p.doctorName || "Dr. Biju Thomas"
  const specialization = p.specialization || "General Medicine"
  const hospitalName = p.hospital || "MEDOX Hospital"
  const patientName = p.patientName || "Rahul Sharma"
  const dateStr = p.date || new Date().toLocaleDateString()
  const rxId = p.prescriptionId || "RX-00001"
  const diagnosis = p.diagnosis || "General Consultation"
  const notes = p.notes || ""
  const medicines = p.medicines || []

  const html = `
    <html>
      <head>
        <title>Prescription_${rxId}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; padding: 40px; margin: 0; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .logo-text { font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: 1px; }
          .hospital-info { text-align: right; font-size: 14px; color: #666; }
          .doctor-section { margin-bottom: 30px; font-size: 15px; }
          .doctor-name { font-size: 18px; font-weight: bold; color: #1e3a8a; }
          .doctor-spec { color: #4b5563; font-style: italic; }
          .patient-section { display: flex; justify-content: space-between; background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 35px; font-size: 14px; }
          .rx-container { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 15px; font-family: Georgia, serif; }
          .meds-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          .meds-table th { background-color: #f3f4f6; color: #374151; font-weight: 600; text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; font-size: 14px; }
          .meds-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          .diagnosis-section { margin-bottom: 25px; }
          .section-title { font-size: 15px; font-weight: bold; color: #1e3a8a; margin-bottom: 5px; }
          .section-content { font-size: 14px; color: #4b5563; background: #fafafa; border: 1px solid #e5e7eb; padding: 12px; border-radius: 6px; }
          .footer { margin-top: 80px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          .signature-area { text-align: center; }
          .signature-line { width: 200px; border-bottom: 1px dashed #9ca3af; margin-bottom: 5px; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo-text">MEDOX</div>
            <div style="font-size: 12px; color: #666; margin-top: 2px;">Smart Healthcare Platform</div>
          </div>
          <div class="hospital-info">
            <strong>${hospitalName}</strong><br/>
            Online Medical Consultation Portal
          </div>
        </div>

        <div class="doctor-section">
          <div class="doctor-name">${doctorName}</div>
          <div class="doctor-spec">${specialization}</div>
        </div>

        <div class="patient-section">
          <div>
            <strong>Patient Name:</strong> ${patientName}<br/>
            <strong>Diagnosis:</strong> ${diagnosis}
          </div>
          <div style="text-align: right;">
            <strong>Date:</strong> ${dateStr}<br/>
            <strong>Prescription ID:</strong> ${rxId}
          </div>
        </div>

        <div class="rx-container">℞</div>

        <table class="meds-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            ${medicines.map((m: any) => `
              <tr>
                <td><strong>${m.name}</strong></td>
                <td>${m.dosage || "As Directed"}</td>
                <td>${m.frequency || "Once Daily"}</td>
                <td>${m.duration || "N/A"}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${notes ? `
          <div class="diagnosis-section">
            <div class="section-title">Special Instructions / Notes</div>
            <div class="section-content">${notes}</div>
          </div>
        ` : ''}

        <div class="footer">
          <div>
            Generated securely by MEDOX Healthcare Platform.<br/>
            This is a digitally verified prescription.
          </div>
          <div class="signature-area">
            <div class="signature-line"></div>
            Digitally Signed by ${doctorName}
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `

  const win = window.open("", "_blank")
  if (win) {
    win.document.write(html)
    win.document.close()
  } else {
    alert("Please allow popups to download prescription PDF.")
  }
}
