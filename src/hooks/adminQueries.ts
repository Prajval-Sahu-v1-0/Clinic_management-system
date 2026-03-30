"use server";

// ============================================================
// src/lib/adminQueries.ts
// All Supabase queries for the Admin Dashboard
// ============================================================

import { supabase } from "@/lib/supabase"; // your existing client
import bcrypt from "bcryptjs";
import type {
    User, Appointment, Prescription, Role, DashboardStats,
    DbUser, DbAppointment, DbPrescription, DbRole,
} from "@/hooks/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derives initials avatar from a full name */
function toAvatar(name: string): string {
    return name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

/** Formats a Supabase ISO timestamp to "Mon YYYY" */
function toMonthYear(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/** Formats an ISO datetime to separate date + time strings */
function splitDateTime(iso: string): { date: string; time: string } {
    const d = new Date(iso);
    return {
        date: d.toISOString().split("T")[0],
        time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    };
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function fetchDashboardStats(): Promise<DashboardStats> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
        { count: totalPatients },
        { count: staffMembers },
        { count: appointmentsToday },
        { count: activePrescriptions },
        { count: rolesCount },
    ] = await Promise.all([
        supabase.from("patient").select("*", { count: "exact", head: true }),
        supabase.from("staff").select("*", { count: "exact", head: true }),
        supabase
            .from("appointment")
            .select("*", { count: "exact", head: true })
            .gte("appointment_time", todayStart.toISOString())
            .lte("appointment_time", todayEnd.toISOString()),
        supabase
            .from("prescription")
            .select("*", { count: "exact", head: true })
            .eq("status", "active"),
        supabase.from("role").select("*", { count: "exact", head: true }),
    ]);

    return {
        totalPatients: totalPatients ?? 0,
        staffMembers: staffMembers ?? 0,
        appointmentsToday: appointmentsToday ?? 0,
        activePrescriptions: activePrescriptions ?? 0,
        rolesCount: rolesCount ?? 0,
    };
}

// ─── Users / Staff ────────────────────────────────────────────────────────────

/**
 * Returns all users shaped for the frontend UsersTable.
 * Joins the role table to resolve role_name → "admin" | "staff" | "patient"
 */
export async function fetchUsers(): Promise<User[]> {
    const { data, error } = await supabase
        .from("user")
        .select(`
      user_id,
      name,
      email,
      status,
      created_at,
      role:role_id ( role_id, role_name )
    `)
        .order("created_at", { ascending: false });

    if (error) throw error;

    return (data as any[]).map((u) => {
        // Map role_name → simplified role token used by the frontend
        const roleName: string = u.role?.role_name?.toLowerCase() ?? "";
        const role: User["role"] = roleName.includes("admin")
            ? "admin"
            : roleName.includes("patient")
                ? "patient"
                : "staff";

        return {
            id: String(u.user_id),
            name: u.name,
            email: u.email ?? "",
            role,
            status: u.status as User["status"],
            avatar: toAvatar(u.name),
            joined: toMonthYear(u.created_at),
        };
    });
}

/** Fetch only staff users (role contains "staff" or "doctor" or "nurse") */
export async function fetchStaffUsers(): Promise<User[]> {
    const all = await fetchUsers();
    return all.filter((u) => u.role === "staff");
}

/** Fetch only patient users */
export async function fetchPatientUsers(): Promise<User[]> {
    // Patients come from the `patient` table, not `user`
    const { data, error } = await supabase
        .from("patient")
        .select("patient_id, patient_name, email, status, created_at")
        .order("created_at", { ascending: false });

    if (error) throw error;

    return (data as any[]).map((p) => ({
        id: String(p.patient_id),
        name: p.patient_name,
        email: p.email ?? "",
        role: "patient" as const,
        status: p.status as User["status"],
        avatar: toAvatar(p.patient_name),
        joined: toMonthYear(p.created_at),
    }));
}

/** Update user status (activate / deactivate) */
export async function updateUserStatus(
    userId: string,
    status: "active" | "inactive"
): Promise<void> {
    const { error } = await supabase
        .from("user")
        .update({ status })
        .eq("user_id", userId);
    if (error) throw error;
}

/** Update patient status */
export async function updatePatientStatus(
    patientId: string,
    status: "active" | "inactive"
): Promise<void> {
    const { error } = await supabase
        .from("patient")
        .update({ status })
        .eq("patient_id", patientId);
    if (error) throw error;
}

// ─── Appointments ──────────────────────────────────────────────────────────────

export async function fetchAppointments(): Promise<Appointment[]> {
    const { data, error } = await supabase
        .from("appointment")
        .select(`
      appointment_id,
      appointment_time,
      appointment_type,
      status,
      patient:patient_id ( patient_name ),
      staff:staff_id ( user:user_id ( name ) )
    `)
        .order("appointment_time", { ascending: true });

    if (error) throw error;

    return (data as any[]).map((a) => {
        const { date, time } = splitDateTime(a.appointment_time);
        return {
            id: `A${String(a.appointment_id).padStart(3, "0")}`,
            patient: a.patient?.patient_name ?? "Unknown",
            doctor: a.staff?.user?.name ? `Dr. ${a.staff.user.name}` : "Unknown",
            date,
            time,
            type: a.appointment_type,
            status: a.status as Appointment["status"],
        };
    });
}

export async function fetchTodaysAppointments(): Promise<Appointment[]> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
        .from("appointment")
        .select(`
      appointment_id,
      appointment_time,
      appointment_type,
      status,
      patient:patient_id ( patient_name ),
      staff:staff_id ( user:user_id ( name ) )
    `)
        .gte("appointment_time", todayStart.toISOString())
        .lte("appointment_time", todayEnd.toISOString())
        .order("appointment_time", { ascending: true });

    if (error) throw error;

    return (data as any[]).map((a) => {
        const { date, time } = splitDateTime(a.appointment_time);
        return {
            id: `A${String(a.appointment_id).padStart(3, "0")}`,
            patient: a.patient?.patient_name ?? "Unknown",
            doctor: a.staff?.user?.name ? `Dr. ${a.staff.user.name}` : "Unknown",
            date,
            time,
            type: a.appointment_type,
            status: a.status as Appointment["status"],
        };
    });
}

export async function updateAppointmentStatus(
    appointmentId: number,
    status: Appointment["status"]
): Promise<void> {
    const { error } = await supabase
        .from("appointment")
        .update({ status })
        .eq("appointment_id", appointmentId);
    if (error) throw error;
}

export async function createAppointment(
    patientId: string,
    staffId: string,
    time: string,
    type: string
): Promise<void> {
    const { error } = await supabase
        .from("appointment")
        .insert({
            patient_id: patientId,
            staff_id: staffId,
            appointment_time: time,
            appointment_type: type,
            status: "pending",
        });
    if (error) throw error;
}

// ─── Prescriptions ─────────────────────────────────────────────────────────────

export async function fetchPrescriptions(): Promise<Prescription[]> {
    const { data, error } = await supabase
        .from("prescription")
        .select(`
      prescription_id,
      medication_name,
      dosage,
      status,
      prescribed_at,
      patient:patient_id ( patient_name ),
      staff:staff_id ( user:user_id ( name ) )
    `)
        .order("prescribed_at", { ascending: false });

    if (error) throw error;

    return (data as any[]).map((rx) => ({
        id: `RX${String(rx.prescription_id).padStart(3, "0")}`,
        patient: rx.patient?.patient_name ?? "Unknown",
        doctor: rx.staff?.user?.name ? `Dr. ${rx.staff.user.name}` : "Unknown",
        medication: rx.medication_name,
        dosage: rx.dosage,
        date: rx.prescribed_at,
        status: rx.status as Prescription["status"],
    }));
}

export async function updatePrescriptionStatus(
    prescriptionId: number,
    status: Prescription["status"]
): Promise<void> {
    const { error } = await supabase
        .from("prescription")
        .update({ status })
        .eq("prescription_id", prescriptionId);
    if (error) throw error;
}

export async function createPrescription(
    patientId: string,
    staffId: string,
    medicationName: string,
    dosage: string
): Promise<void> {
    const { error } = await supabase
        .from("prescription")
        .insert({
            patient_id: patientId,
            staff_id: staffId,
            medication_name: medicationName,
            dosage,
            status: "active",
        });
    if (error) throw error;
}

// ─── Roles ─────────────────────────────────────────────────────────────────────

export async function fetchRoles(): Promise<Role[]> {
    const { data: roles, error } = await supabase
        .from("role")
        .select("role_id, role_name, color, permissions")
        .order("role_id");

    if (error) throw error;

    // Count members per role from the `user` table
    const { data: userCounts } = await supabase
        .from("user")
        .select("role_id");

    const countMap: Record<number, number> = {};
    (userCounts ?? []).forEach((u: any) => {
        countMap[u.role_id] = (countMap[u.role_id] ?? 0) + 1;
    });

    return (roles as any[]).map((r) => ({
        id: String(r.role_id),
        name: r.role_name,
        color: r.color ?? "#16a34a",
        permissions: r.permissions ?? [],
        members: countMap[r.role_id] ?? 0,
    }));
}

export async function updateRole(
    roleId: string,
    updates: { role_name?: string; color?: string; permissions?: string[] }
): Promise<void> {
    const { error } = await supabase
        .from("role")
        .update(updates)
        .eq("role_id", roleId);
    if (error) throw error;
}

export async function createRole(
    name: string,
    color: string,
    permissions: string[]
): Promise<void> {
    const { error } = await supabase
        .from("role")
        .insert({ role_name: name, color, permissions });
    if (error) throw error;
}

// ─── Password Management ──────────────────────────────────────────────────────

export async function changeUserPassword(
    userId: string,
    newPassword: string
): Promise<void> {
    if (!newPassword || newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters.");
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
        .from("user")
        .update({ password_hash: passwordHash })
        .eq("user_id", userId);
    if (error) throw error;
}