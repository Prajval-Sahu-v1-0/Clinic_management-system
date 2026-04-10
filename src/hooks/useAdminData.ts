// ============================================================
// src/hooks/useAdminData.ts
// React hooks that wrap adminQueries for the Admin Dashboard
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import type {
    User, Appointment, Prescription, Role, DashboardStats,
} from "@/hooks/types";
import {
    fetchDashboardStats,
    fetchUsers,
    fetchPatientUsers,
    fetchAppointments,
    fetchTodaysAppointments,
    fetchPrescriptions,
    fetchRoles,
    updateUserStatus,
    updatePatientStatus,
    updateAppointmentStatus,
    updatePrescriptionStatus,
    updateRole,
    createRole,
    changeUserPassword,
    createAppointment,
    createPrescription,
    deletePrescription,
    fetchInventory,
    addInventoryItem,
    updateInventoryQty,
    removeInventoryItem,
    fetchMedicines,
    upsertInventoryItem,
    fetchAuditLogs,
    type InventoryItem,
    type MedicineLookup,
    type AuditEntry,
} from "@/hooks/adminQueries";

// ─── Generic fetcher hook ─────────────────────────────────────────────────────

function useQuery<T>(fetcher: () => Promise<T>) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(() => {
        setLoading(true);
        setError(null);
        fetcher()
            .then(setData)
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, [fetcher]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, loading, error, refetch };
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export function useDashboardStats() {
    return useQuery(fetchDashboardStats);
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function useUsers() {
    const { data: session } = useSession();
    const query = useQuery(fetchUsers);

    const deactivate = useCallback(async (userId: string) => {
        try {
            await updateUserStatus(userId, "inactive", session?.user?.id as string);
            query.refetch();
        } catch (err: any) {
            console.error("Failed to deactivate user:", err);
        }
    }, [query.refetch]);

    const resetPassword = useCallback(async (userId: string, newPassword: string) => {
        await changeUserPassword(userId, newPassword, session?.user?.id as string);
    }, []);

    return { ...query, deactivate, resetPassword };
}

// ─── Patients ─────────────────────────────────────────────────────────────────

export function usePatients() {
    const { data: session } = useSession();
    const query = useQuery(fetchPatientUsers);

    const deactivate = useCallback(async (patientId: string) => {
        try {
            await updatePatientStatus(patientId, "inactive", session?.user?.id as string);
            query.refetch();
        } catch (err: any) {
            console.error("Failed to deactivate patient:", err);
        }
    }, [query.refetch]);

    return { ...query, deactivate };
}

// ─── Appointments ──────────────────────────────────────────────────────────────

export function useAppointments() {
    const { data: session } = useSession();
    const query = useQuery(fetchAppointments);

    const cancel = useCallback(async (appointmentId: string) => {
        try {
            await updateAppointmentStatus(appointmentId, "cancelled", session?.user?.id as string);
            query.refetch();
        } catch (err: any) {
            console.error("Failed to cancel appointment:", err);
        }
    }, [query.refetch]);

    const addAppointment = useCallback(async (
        patientId: string,
        staffId: string,
        time: string,
        type: string
    ) => {
        try {
            await createAppointment(patientId, staffId, time, type, session?.user?.id as string);
            query.refetch();
        } catch (err: any) {
            console.error("Failed to create appointment:", err);
            throw err;
        }
    }, [query.refetch]);

    return { ...query, cancel, addAppointment };
}

export function useTodaysAppointments() {
    return useQuery(fetchTodaysAppointments);
}

// ─── Prescriptions ─────────────────────────────────────────────────────────────

export function usePrescriptions() {
    const { data: session } = useSession();
    const query = useQuery(fetchPrescriptions);

    const renew = useCallback(async (prescriptionId: string, newEndDate?: string) => {
        try {
            const numericId = parseInt(prescriptionId.replace(/\D/g, ""), 10);
            await updatePrescriptionStatus(numericId, "active", session?.user?.id as string, newEndDate);
            query.refetch();
        } catch (err: any) {
            console.error("Failed to renew prescription:", err);
        }
    }, [query.refetch]);

    const addPrescription = useCallback(async (
        patientId: string,
        staffId: string,
        medicationName: string,
        dosage: string,
        dosageEndDate: string
    ) => {
        try {
            await createPrescription(patientId, staffId, medicationName, dosage, session?.user?.id as string, dosageEndDate);
            query.refetch();
        } catch (err: any) {
            console.error("Failed to create prescription:", err);
            throw err;
        }
    }, [query.refetch]);

    const removePrescription = useCallback(async (prescriptionId: string) => {
        try {
            const numericId = parseInt(prescriptionId.replace(/\D/g, ""), 10);
            await deletePrescription(numericId, session?.user?.id as string);
            query.refetch();
        } catch (err: any) {
            console.error("Failed to delete prescription:", err);
            throw err;
        }
    }, [query.refetch]);

    return { ...query, renew, addPrescription, removePrescription };
}

// ─── Roles ─────────────────────────────────────────────────────────────────────

export function useRoles() {
    const { data: session } = useSession();
    const query = useQuery(fetchRoles);

    const saveRole = useCallback(async (
        roleId: string,
        updates: { role_name?: string; color?: string; permissions?: string[] }
    ) => {
        try {
            await updateRole(roleId, updates, session?.user?.id as string);
            query.refetch();
        } catch (err: any) {
            console.error("Failed to update role:", err);
        }
    }, [query.refetch]);

    const addRole = useCallback(async (
        name: string,
        color: string,
        permissions: string[]
    ) => {
        try {
            await createRole(name, color, permissions, session?.user?.id as string);
            query.refetch();
        } catch (err: any) {
            console.error("Failed to create role:", err);
        }
    }, [query.refetch]);

    return { ...query, saveRole, addRole };
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export type { InventoryItem };

export function useInventory() {
    const { data: session } = useSession();
    const query = useQuery(fetchInventory);

    const add = useCallback(async (
        medicine_name: string,
        category: string | null,
        manufacturer: string | null,
        expiry_date: string | null,
        quantity_available: number,
        reorder_level: number
    ) => {
        await addInventoryItem(medicine_name, category, manufacturer, expiry_date, quantity_available, reorder_level, session?.user?.id as string);
        query.refetch();
    }, [query.refetch]);

    const updateQty = useCallback(async (inventoryId: number, qty: number) => {
        await updateInventoryQty(inventoryId, qty, session?.user?.id as string);
        query.refetch();
    }, [query.refetch]);

    const remove = useCallback(async (inventoryId: number, medicineId: number) => {
        await removeInventoryItem(inventoryId, medicineId, session?.user?.id as string);
        query.refetch();
    }, [query.refetch]);

    const upsert = useCallback(async (medicine_id: number, qty: number, reorder: number) => {
        await upsertInventoryItem(medicine_id, qty, reorder, session?.user?.id as string);
        query.refetch();
    }, [query.refetch]);

    return { ...query, add, updateQty, remove, upsert };
}

// ─── Medicines lookup ─────────────────────────────────────────────────────────

export type { MedicineLookup };

export function useMedicines() {
    return useQuery(fetchMedicines);
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export type { AuditEntry };

interface AuditResponse {
    data: AuditEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export function useAuditLogs(
    page: number = 1,
    limit: number = 15,
    actionFilter: string = "all",
    actorFilter: string = ""
) {
    const [response, setResponse] = useState<AuditResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(() => {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (actionFilter !== "all") params.append("action", actionFilter);
        if (actorFilter.trim()) params.append("actor", actorFilter.trim());

        fetch(`/api/audit?${params.toString()}`)
            .then(async res => {
                if (!res.ok) {
                    const e = await res.json().catch(() => ({}));
                    throw new Error(e.error || `HTTP ${res.status}`);
                }
                return res.json();
            })
            .then(setResponse)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [page, limit, actionFilter, actorFilter]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { response, loading, error, refetch };
}
