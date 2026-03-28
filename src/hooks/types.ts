// ============================================================
// Supabase Database Row Types — matches actual schema exactly
// ============================================================

export interface DbUser {
    user_id: number;
    name: string;
    username: string;
    email: string | null;
    password_hash: string;
    role_id: number;
    department_id: number | null;
    status: "active" | "inactive" | "pending";
    created_at: string;
}

export interface DbRole {
    role_id: number;
    role_name: string;
    color: string;
    permissions: string[];
}

export interface DbDepartment {
    department_id: number;
    department_name: string;
}

export interface DbPatient {
    patient_id: number;
    patient_name: string;
    contact_number: string;
    email: string | null;
    status: "active" | "inactive" | "pending";
    created_at: string;
}

export interface DbStaff {
    staff_id: number;
    user_id: number;
    designation: string;
    specialization: string;
    // joined from user table:
    user?: DbUser;
}

export interface DbAppointment {
    appointment_id: number;
    patient_id: number;
    staff_id: number;
    appointment_time: string; // ISO datetime
    appointment_type: string;
    status: "confirmed" | "pending" | "cancelled" | "completed";
    created_by: number;
    // joined:
    patient?: Pick<DbPatient, "patient_name">;
    staff?: { user: Pick<DbUser, "name"> };
}

export interface DbPrescription {
    prescription_id: number;
    patient_id: number;
    staff_id: number;
    medicine_id: number | null;
    medication_name: string;
    dosage: string;
    status: "active" | "expired" | "refill";
    prescribed_at: string;
    created_at: string;
    // joined:
    patient?: Pick<DbPatient, "patient_name">;
    staff?: { user: Pick<DbUser, "name"> };
}

// ============================================================
// Frontend-friendly shaped types (what your components consume)
// ============================================================

export interface User {
    id: string;
    name: string;
    email: string;
    role: "admin" | "staff" | "patient";
    status: "active" | "inactive" | "pending";
    avatar: string;
    joined: string;
}

export interface Appointment {
    id: string;
    patient: string;
    doctor: string;
    date: string;
    time: string;
    type: string;
    status: "confirmed" | "pending" | "cancelled" | "completed";
}

export interface Prescription {
    id: string;
    patient: string;
    doctor: string;
    medication: string;
    dosage: string;
    date: string;
    status: "active" | "expired" | "refill";
}

export interface Role {
    id: string;
    name: string;
    color: string;
    permissions: string[];
    members: number;
}

export interface DashboardStats {
    totalPatients: number;
    staffMembers: number;
    appointmentsToday: number;
    activePrescriptions: number;
    rolesCount: number;
}