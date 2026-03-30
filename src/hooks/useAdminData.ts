// ============================================================
// src/hooks/useAdminData.ts
// React hooks that wrap adminQueries for the Admin Dashboard
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
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
    const query = useQuery(fetchUsers);

    const deactivate = useCallback(async (userId: string) => {
        try {
            await updateUserStatus(userId, "inactive");
            query.refetch();
        } catch (err: any) {
            console.error("Failed to deactivate user:", err);
        }
    }, [query.refetch]);

    const resetPassword = useCallback(async (userId: string, newPassword: string) => {
        await changeUserPassword(userId, newPassword);
    }, []);

    return { ...query, deactivate, resetPassword };
}

// ─── Patients ─────────────────────────────────────────────────────────────────

export function usePatients() {
    const query = useQuery(fetchPatientUsers);

    const deactivate = useCallback(async (patientId: string) => {
        try {
            await updatePatientStatus(patientId, "inactive");
            query.refetch();
        } catch (err: any) {
            console.error("Failed to deactivate patient:", err);
        }
    }, [query.refetch]);

    return { ...query, deactivate };
}

// ─── Appointments ──────────────────────────────────────────────────────────────

export function useAppointments() {
    const query = useQuery(fetchAppointments);

    const cancel = useCallback(async (appointmentId: string) => {
        try {
            // Extract numeric id from formatted string like "A001"
            const numericId = parseInt(appointmentId.replace(/\D/g, ""), 10);
            await updateAppointmentStatus(numericId, "cancelled");
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
            await createAppointment(patientId, staffId, time, type);
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
    const query = useQuery(fetchPrescriptions);

    const renew = useCallback(async (prescriptionId: string) => {
        try {
            const numericId = parseInt(prescriptionId.replace(/\D/g, ""), 10);
            await updatePrescriptionStatus(numericId, "active");
            query.refetch();
        } catch (err: any) {
            console.error("Failed to renew prescription:", err);
        }
    }, [query.refetch]);

    const addPrescription = useCallback(async (
        patientId: string,
        staffId: string,
        medicationName: string,
        dosage: string
    ) => {
        try {
            await createPrescription(patientId, staffId, medicationName, dosage);
            query.refetch();
        } catch (err: any) {
            console.error("Failed to create prescription:", err);
            throw err;
        }
    }, [query.refetch]);

    return { ...query, renew, addPrescription };
}

// ─── Roles ─────────────────────────────────────────────────────────────────────

export function useRoles() {
    const query = useQuery(fetchRoles);

    const saveRole = useCallback(async (
        roleId: string,
        updates: { role_name?: string; color?: string; permissions?: string[] }
    ) => {
        try {
            await updateRole(roleId, updates);
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
            await createRole(name, color, permissions);
            query.refetch();
        } catch (err: any) {
            console.error("Failed to create role:", err);
        }
    }, [query.refetch]);

    return { ...query, saveRole, addRole };
}
