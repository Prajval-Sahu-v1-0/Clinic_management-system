"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

import { DashboardLayout, getPermissions, NoAccess } from "@/components/DashboardShared";
import type { NavItem } from "@/components/DashboardShared";

import DashboardOverview from "@/components/sections/DashboardOverview";
import PatientsSection from "@/components/sections/PatientsSection";
import UsersSection from "@/components/sections/UsersSection";
import AppointmentsSection from "@/components/sections/AppointmentsSection";
import PrescriptionsSection from "@/components/sections/PrescriptionsSection";
import InventorySection from "@/components/sections/InventorySection";
import AuditSection from "@/components/sections/AuditSection";
import ProfileSection from "@/components/sections/ProfileSection";

// ─── Full Nav Catalog ─────────────────────────────────────────────────────────
// Every section that any role might see. The `requiredPermission` field gates 
// visibility: if the user's role has that permission, the nav item shows up.

const ALL_NAV: NavItem[] = [
  { id: "dashboard",     icon: "fa-solid fa-gauge-high",       label: "Dashboard" },
  { id: "patients",      icon: "fa-solid fa-user-injured",     label: "Patients",        requiredPermission: "view_patients" },
  { id: "staff",         icon: "fa-solid fa-user-nurse",       label: "Staff & Users",   requiredPermission: "manage_staff" },
  { id: "appointments",  icon: "fa-solid fa-calendar-days",    label: "Appointments",    requiredPermission: "view_appointments" },
  { id: "access",        icon: "fa-solid fa-shield-halved",    label: "Access & Roles",  requiredPermission: "manage_roles" },
  { id: "prescriptions", icon: "fa-solid fa-pills",            label: "Prescriptions",   requiredPermission: "view_prescriptions" },
  { id: "inventory",     icon: "fa-solid fa-boxes-stacked",    label: "Inventory",       requiredPermission: "manage_inventory" },
  { id: "audit",         icon: "fa-solid fa-clock-rotate-left",label: "Audit Logs",      requiredPermission: "view_audit_logs" },
  { id: "profile",       icon: "fa-solid fa-gear",             label: "Settings" },
];

const SECTION_TITLES: Record<string, string> = {
  dashboard:     "Dashboard",
  patients:      "Patients",
  staff:         "Staff & Users",
  appointments:  "Appointments",
  access:        "Access & Roles",
  prescriptions: "Prescriptions",
  inventory:     "Inventory",
  audit:         "Audit Logs",
  profile:       "Profile & Settings",
};

// ─── Page Component ───────────────────────────────────────────────────────────

export default function RoleDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const currentRole = (params?.role as string) ?? "patient";

  const [section, setSection] = useState("dashboard");

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Verify user has this role
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const userRoles: string[] = (session.user as any).roles ?? [(session.user as any).role ?? "patient"];
    if (!userRoles.includes(currentRole)) {
      // Redirect to their primary (first) role
      router.replace(`/${userRoles[0]}`);
    }
  }, [status, session, currentRole, router]);

  // Ensure current section is allowed
  const permissions = getPermissions(session);
  const hasPermission = (perm: string) => permissions.includes(perm);

  useEffect(() => {
    if (status === "loading") return;
    const allowedSections = ALL_NAV
      .filter(n => !n.requiredPermission || hasPermission(n.requiredPermission))
      .map(n => n.id);

    if (!allowedSections.includes(section)) {
      setSection(allowedSections[0] || "dashboard");
    }
  }, [session, section, status]);

  // Loading state
  if (status === "loading") {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f3f4f6", fontFamily: "'Lato', sans-serif" }}>
        <div style={{ textAlign: "center", color: "#9ca3af" }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 28, marginBottom: 12, display: "block", color: "#0d9488" }} />
          Loading dashboard…
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  const userName = session.user.name ?? "User";

  return (
    <DashboardLayout
      session={session}
      currentRole={currentRole}
      navItems={ALL_NAV}
      sectionTitles={SECTION_TITLES}
      activeSection={section}
      onSectionChange={setSection}
    >
      {section === "dashboard" && (
        <DashboardOverview
          setSection={setSection}
          userName={userName}
          currentRole={currentRole}
          permissions={permissions}
        />
      )}

      {section === "patients" && (
        hasPermission("view_patients") ? <PatientsSection permissions={permissions} /> : <NoAccess />
      )}

      {section === "staff" && (
        hasPermission("manage_staff") ? <UsersSection /> : <NoAccess />
      )}

      {section === "appointments" && (
        hasPermission("view_appointments") ? <AppointmentsSection permissions={permissions} /> : <NoAccess />
      )}

      {section === "prescriptions" && (
        hasPermission("view_prescriptions") ? <PrescriptionsSection permissions={permissions} /> : <NoAccess />
      )}

      {section === "inventory" && (
        hasPermission("manage_inventory") ? <InventorySection /> : <NoAccess />
      )}

      {section === "audit" && (
        hasPermission("view_audit_logs") ? <AuditSection /> : <NoAccess />
      )}

      {section === "profile" && <ProfileSection currentRole={currentRole} />}
    </DashboardLayout>
  );
}
