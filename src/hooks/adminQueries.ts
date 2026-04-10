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
import { auth } from "@/../auth";
import { logAudit } from "@/lib/audit";

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
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
        date: `${year}-${month}-${day}`,
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

    if (error) throw new Error(error.message || JSON.stringify(error));

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

    if (error) throw new Error(error.message || JSON.stringify(error));

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
,
    actorId: string
): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const { error } = await supabase
        .from("user")
        .update({ status, actor_id: actorId })
        .eq("user_id", userId);
    if (error) throw new Error(error.message || JSON.stringify(error));
}

/** Update patient status */
export async function updatePatientStatus(
    patientId: string,
    status: "active" | "inactive"
,
    actorId: string
): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const { error } = await supabase
        .from("patient")
        .update({ status })
        .eq("patient_id", patientId);
    if (error) throw new Error(error.message || JSON.stringify(error));
}

export async function deletePatientRecord(patientId: string): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { data: apts } = await supabase
        .from("appointment")
        .select("appointment_id")
        .eq("patient_id", patientId)
        .eq("status", "scheduled")
        .gte("appointment_time", startOfToday.toISOString());
    if (apts && apts.length > 0) throw new Error("Cannot delete patient: This patient has upcoming appointments.");

    const { data: pres } = await supabase
        .from("prescription")
        .select("prescription_id")
        .eq("patient_id", patientId)
        .eq("status", "active");
    if (pres && pres.length > 0) throw new Error("Cannot delete patient: This patient has active prescriptions.");

    const { error } = await supabase
        .from("patient")
        .delete()
        .eq("patient_id", patientId);
    if (error) throw new Error(error.message || JSON.stringify(error));
}

export async function deleteUserRecord(userId: string): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const { data: userRec } = await supabase
        .from("user")
        .select("role:role_id(role_name)")
        .eq("user_id", userId)
        .single();
        
    if (userRec?.role?.role_name?.toLowerCase() === "permanent") {
        throw new Error("Cannot delete user: This user has the 'permanent' system role.");
    }

    const { data: staffRec } = await supabase
        .from("staff")
        .select("staff_id")
        .eq("user_id", userId)
        .single();

    if (staffRec) {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const { data: apts } = await supabase
            .from("appointment")
            .select("appointment_id")
            .eq("staff_id", staffRec.staff_id)
            .eq("status", "scheduled")
            .gte("appointment_time", startOfToday.toISOString());
        if (apts && apts.length > 0) throw new Error("Cannot delete user: This user is assigned to upcoming appointments.");

        const { data: pres } = await supabase
            .from("prescription")
            .select("prescription_id")
            .eq("staff_id", staffRec.staff_id)
            .eq("status", "active");
        if (pres && pres.length > 0) throw new Error("Cannot delete user: This user is assigned to active prescriptions.");
    }

    const { error } = await supabase
        .from("user")
        .delete()
        .eq("user_id", userId);
    if (error) throw new Error(error.message || JSON.stringify(error));
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

    if (error) throw new Error(error.message || JSON.stringify(error));

    return (data as any[]).map((a) => {
        const { date, time } = splitDateTime(a.appointment_time);
        return {
            id: a.appointment_id,
            patient: a.patient?.patient_name ?? "Unknown",
            doctor: a.staff?.user?.name ? `Dr. ${a.staff.user.name}` : "Unknown",
            date,
            time,
            type: a.appointment_type || "N/A",
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

    if (error) throw new Error(error.message || JSON.stringify(error));

    return (data as any[]).map((a) => {
        const { date, time } = splitDateTime(a.appointment_time);
        return {
            id: a.appointment_id,
            patient: a.patient?.patient_name ?? "Unknown",
            doctor: a.staff?.user?.name ? `Dr. ${a.staff.user.name}` : "Unknown",
            date,
            time,
            type: a.appointment_type || "N/A",
            status: a.status as Appointment["status"],
        };
    });
}

export async function updateAppointmentStatus(
    appointmentId: string,
    status: Appointment["status"]
,
    actorId: string
): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const { error } = await supabase
        .from("appointment")
        .update({ status })
        .eq("appointment_id", appointmentId);
    if (error) throw new Error(error.message || JSON.stringify(error));
}

export async function updateAppointmentTime(
    appointmentId: string,
    datetime: string,
    actorId: string
): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const { error } = await supabase
        .from("appointment")
        .update({ appointment_time: datetime })
        .eq("appointment_id", appointmentId);
    if (error) throw new Error(error.message || JSON.stringify(error));
}

export async function createAppointment(
    patientId: string,
    userIdAsStaff: string,
    time: string,
    type: string,
    actorId: string
): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // 1. Resolve actual staff_id from the `staff` table using the provided user_id
    let { data: staffRec } = await supabase
        .from("staff")
        .select("staff_id")
        .eq("user_id", userIdAsStaff)
        .single();
    
    if (!staffRec) {
        const { data: newStaff, error: insertStaffErr } = await supabase
            .from("staff")
            .insert({ user_id: userIdAsStaff })
            .select("staff_id")
            .single();
        if (insertStaffErr) throw new Error("Failed to resolve staff profile: " + insertStaffErr.message);
        staffRec = newStaff;
    }

    const { error } = await supabase
        .from("appointment")
        .insert({
            patient_id: patientId,
            staff_id: staffRec.staff_id,
            appointment_time: time,
            appointment_type: type,
            status: "scheduled",
        });
    if (error) throw new Error(error.message || JSON.stringify(error));
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
      Dosage_end_Date,
      patient:patient_id ( patient_name ),
      staff:staff_id ( user:user_id ( name ) )
    `)
        .order("prescribed_at", { ascending: false });

    if (error) {
        console.error("[PRESCRIPTION FETCH] Error:", JSON.stringify(error));
        throw new Error(error.message || JSON.stringify(error));
    }

    return (data as any[]).map((rx) => ({
        id: `RX${String(rx.prescription_id).padStart(3, "0")}`,
        patient: rx.patient?.patient_name ?? "Unknown",
        doctor: rx.staff?.user?.name ? `Dr. ${rx.staff.user.name}` : "Unknown",
        medication: rx.medication_name,
        dosage: rx.dosage,
        date: rx.prescribed_at ?? "",
        dosageEndDate: rx.Dosage_end_Date ?? null,
        status: rx.status,
    }));
}

export async function updatePrescriptionStatus(
    prescriptionId: number,
    status: string,
    actorId: string,
    dosageEndDate?: string
): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    
    const payload: any = { status };
    if (dosageEndDate !== undefined) payload.Dosage_end_Date = dosageEndDate || null;

    const { error } = await supabase
        .from("prescription")
        .update(payload)
        .eq("prescription_id", prescriptionId);
    if (error) throw new Error(error.message || JSON.stringify(error));
}


export async function createPrescription(
    patientId: string, // This is patient.patient_id from the UI
    userIdAsStaff: string, // The UI passes user.user_id as staffId
    medicationName: string,
    dosage: string,
    actorId: string,
    dosageEndDate?: string
): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // 1. Resolve actual staff_id from the `staff` table using the provided user_id
    let { data: staffRec } = await supabase
        .from("staff")
        .select("staff_id")
        .eq("user_id", userIdAsStaff)
        .single();
    
    // Auto-create staff profile if missing to prevent FK violations
    if (!staffRec) {
        const { data: newStaff, error: insertStaffErr } = await supabase
            .from("staff")
            .insert({ user_id: userIdAsStaff })
            .select("staff_id")
            .single();
        if (insertStaffErr) throw new Error("Failed to resolve staff profile: " + insertStaffErr.message);
        staffRec = newStaff;
    }

    const { error } = await supabase
        .from("prescription")
        .insert({
            patient_id: patientId,
            staff_id: staffRec.staff_id,
            medication_name: medicationName,
            dosage: dosage,
            status: "active",
            Dosage_end_Date: dosageEndDate || null,
        });
    if (error) throw new Error(error.message || JSON.stringify(error));
}

export async function deletePrescription(
    prescriptionId: number,
    actorId: string
): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const { error } = await supabase
        .from("prescription")
        .delete()
        .eq("prescription_id", prescriptionId);
    if (error) throw new Error(error.message || JSON.stringify(error));
}

// ─── Roles ─────────────────────────────────────────────────────────────────────

export async function fetchRoles(): Promise<Role[]> {
    const { data: roles, error } = await supabase
        .from("role")
        .select("role_id, role_name, color, permissions")
        .order("role_id");

    if (error) throw new Error(error.message || JSON.stringify(error));

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
,
    actorId: string
): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const { error } = await supabase
        .from("role")
        .update({ ...updates, actor_id: actorId })
        .eq("role_id", roleId);
    if (error) throw new Error(error.message || JSON.stringify(error));
}

export async function createRole(
    name: string,
    color: string,
    permissions: string[]
,
    actorId: string
): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const { error } = await supabase
        .from("role")
        .insert({ role_name: name, color, permissions, actor_id: actorId });
    if (error) throw new Error(error.message || JSON.stringify(error));
}

// ─── Password Management ──────────────────────────────────────────────────────

export async function changeUserPassword(
    userId: string,
    newPassword: string
,
    actorId: string
): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    if (!newPassword || newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters.");
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
        .from("user")
        .update({ password_hash: passwordHash, actor_id: actorId })
        .eq("user_id", userId);
    if (error) throw new Error(error.message || JSON.stringify(error));
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export type InventoryItem = {
    inventory_id: number;
    quantity_available: number;
    reorder_level: number;
    medicine: {
        medicine_id: number;
        medicine_name: string;
        category: string | null;
        manufacturer: string | null;
        expiry_date: string | null;
    };
};

export async function fetchInventory(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
        .from("inventory")
        .select(`
            inventory_id, quantity_available, reorder_level,
            medicine:medicine_id ( medicine_id, medicine_name, category, manufacturer, expiry_date )
        `)
        .order("inventory_id", { ascending: true });
    if (error) throw new Error(error.message || JSON.stringify(error));
    return (data as any[]) ?? [];
}

export async function addInventoryItem(
    medicine_name: string,
    category: string | null,
    manufacturer: string | null,
    expiry_date: string | null,
    quantity_available: number,
    reorder_level: number
,
    actorId: string
): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const { data: med, error: me } = await supabase
        .from("medicine")
        .insert({ medicine_name, category, manufacturer, expiry_date, actor_id: actorId })
        .select("medicine_id, medicine_name, category, manufacturer")
        .single();
    if (me) throw me;

    const { data: inv, error: ie } = await supabase
        .from("inventory")
        .insert({ medicine_id: med.medicine_id, quantity_available, reorder_level, actor_id: actorId })
        .select()
        .single();
    if (ie) throw ie;

    await logAudit({
        action: "create", actor_id: actorId, actor_role: (session.user as any).role || "unknown",
        entity_type: "inventory", entity_id: String(inv.inventory_id),
        after_data: { medicine: med, inventory: inv }
    });
}

export type MedicineLookup = {
    medicine_id: number;
    medicine_name: string;
    category: string | null;
    manufacturer: string | null;
    expiry_date: string | null;
};

export async function fetchMedicines(): Promise<MedicineLookup[]> {
    const { data, error } = await supabase
        .from("medicine")
        .select("medicine_id, medicine_name, category, manufacturer, expiry_date")
        .order("medicine_name", { ascending: true });
    if (error) throw new Error(error.message || JSON.stringify(error));
    return (data as MedicineLookup[]) ?? [];
}

export async function upsertInventoryItem(
    medicine_id: number,
    quantity_to_add: number,
    reorder_level: number
,
    actorId: string
): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const { data: existing } = await supabase
        .from("inventory")
        .select("inventory_id, quantity_available")
        .eq("medicine_id", medicine_id)
        .maybeSingle();

    if (existing) {
        const afterQty = existing.quantity_available + quantity_to_add;
        const { error } = await supabase
            .from("inventory")
            .update({ quantity_available: afterQty, actor_id: actorId })
            .eq("inventory_id", existing.inventory_id);
        if (error) throw new Error(error.message || JSON.stringify(error));
        await logAudit({
            action: "update", actor_id: actorId, actor_role: (session.user as any).role || "unknown",
            entity_type: "inventory", entity_id: String(existing.inventory_id),
            before_data: { quantity_available: existing.quantity_available },
            after_data: { quantity_available: afterQty }
        });
    } else {
        const { data: inv, error } = await supabase
            .from("inventory")
            .insert({ medicine_id, quantity_available: quantity_to_add, reorder_level, actor_id: actorId })
            .select()
            .single();
        if (error) throw new Error(error.message || JSON.stringify(error));
        await logAudit({
            action: "create", actor_id: actorId, actor_role: (session.user as any).role || "unknown",
            entity_type: "inventory", entity_id: String(inv.inventory_id),
            after_data: inv
        });
    }
}

export async function updateInventoryQty(
    inventoryId: number,
    quantity_available: number
,
    actorId: string
): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const { data: existing } = await supabase.from("inventory").select("quantity_available").eq("inventory_id", inventoryId).single();
    if (!existing) return;
    const { error } = await supabase
        .from("inventory")
        .update({ quantity_available, actor_id: actorId })
        .eq("inventory_id", inventoryId);
    if (error) throw new Error(error.message || JSON.stringify(error));
    await logAudit({
        action: "update", actor_id: actorId, actor_role: (session.user as any).role || "unknown",
        entity_type: "inventory", entity_id: String(inventoryId),
        before_data: existing, after_data: { quantity_available }
    });
}

export async function removeInventoryItem(
    inventoryId: number,
    medicineId: number
,
    actorId: string
): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const { data: existingMed } = await supabase.from("medicine").select("*").eq("medicine_id", medicineId).single();

    const { error: ie } = await supabase
        .from("inventory")
        .delete({ actor_id: actorId } as any)
        .eq("inventory_id", inventoryId);
    if (ie) throw ie;
    const { error: me } = await supabase
        .from("medicine")
        .delete({ actor_id: actorId } as any)
        .eq("medicine_id", medicineId);
    if (me) throw me;

    await logAudit({
        action: "delete", actor_id: actorId, actor_role: (session.user as any).role || "unknown",
        entity_type: "inventory", entity_id: String(inventoryId),
        before_data: { medicine: existingMed }
    });
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export type AuditEntry = {
    id: string;
    source: "audit_log" | "role_audit";
    user_id: string | null;
    actor: string;
    actor_role?: string;
    action: string;
    entity: string;
    entity_id?: string;
    before_data?: any;
    after_data?: any;
    timestamp: string;
};

export async function fetchAuditLogs(): Promise<AuditEntry[]> {
    // Fetch audit_log rows (join user name)
    const { data: logs } = await supabase
        .from("audit_log")
        .select("log_id, user_id, action, table_affected, timestamp, user:user_id ( name )")
        .order("timestamp", { ascending: false })
        .limit(200);

    // Fetch role_audit rows (join user + role names)
    const { data: roleAudits } = await supabase
        .from("role_audit")
        .select("id, user_id, changed_by, role_id, action, created_at, user:user_id ( name ), role:role_id ( role_name )")
        .order("created_at", { ascending: false })
        .limit(200);

    const normalized: AuditEntry[] = [
        ...((logs ?? []) as any[]).map((r: any) => ({
            id: `al-${r.log_id}`,
            source: "audit_log" as const,
            user_id: r.user_id ?? null,
            actor: r.user?.name ?? r.user_id ?? "System",
            action: r.action ?? "—",
            entity: r.table_affected ?? "—",
            timestamp: r.timestamp,
        })),
        ...((roleAudits ?? []) as any[]).map((r: any) => ({
            id: `ra-${r.id}`,
            source: "role_audit" as const,
            user_id: r.user_id ?? null,
            actor: r.user?.name ?? r.changed_by ?? "System",
            action: r.action ?? "—",
            entity: r.role?.role_name ? `role: ${r.role.role_name}` : "role",
            timestamp: r.created_at,
        })),
    ];

    // Sort combined list newest-first
    normalized.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return normalized;
}

