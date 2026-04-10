"use client";

import { useSession, signOut } from "next-auth/react";
import { Badge, ActionButton } from "@/components/DashboardShared";

export default function ProfileSection({ currentRole }: { currentRole: string }) {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "User";
  const userEmail = session?.user?.email ?? "";
  const userInitials = userName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 32, flex: "0 0 280px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg, #0d9488, #14b8a6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, boxShadow: "0 8px 24px rgba(22,163,74,0.3)" }}>{userInitials}</div>
          <div style={{ position: "absolute", bottom: -4, right: -4, width: 22, height: 22, borderRadius: "50%", background: "#0d9488", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="fa-solid fa-check" style={{ color: "#fff", fontSize: 9 }} />
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", fontFamily: "'Outfit', sans-serif" }}>{userName}</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>{userEmail}</div>
        </div>
        <Badge label={currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} color="#0d9488" bg="#f0fdfa" />
      </div>
      <div style={{ flex: 1, minWidth: 300, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16, fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 9 }}>
          <i className="fa-solid fa-lock" style={{ color: "#0d9488", fontSize: 16 }} />
          Security
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Change Password", icon: "fa-solid fa-key", danger: false },
            { label: "Manage Two-Factor Authentication", icon: "fa-solid fa-mobile-screen-button", danger: false },
            { label: "Sign Out of All Sessions", icon: "fa-solid fa-right-from-bracket", danger: true, onClick: () => signOut({ callbackUrl: "/" }) },
          ].map((item) => (
            <button key={item.label} onClick={item.onClick} style={{
              background: item.danger ? "#fef2f2" : "#f9fafb",
              border: `1px solid ${item.danger ? "#fee2e2" : "#e5e7eb"}`,
              borderRadius: 9, padding: "12px 16px",
              color: item.danger ? "#dc2626" : "#374151",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              textAlign: "left", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <i className={item.icon} style={{ fontSize: 14, width: 16, color: item.danger ? "#dc2626" : "#9ca3af" }} />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
