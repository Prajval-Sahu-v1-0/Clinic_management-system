"use client";

import { useState } from "react";
import { Badge, ActionButton, LoadingRows, ErrorMessage, statusColor, statusBg, roleColor } from "@/components/DashboardShared";
import { usePatients, useUsers } from "@/hooks/useAdminData";
import type { User } from "@/hooks/types";

export default function PatientsSection({ permissions }: { permissions: string[] }) {
  const [search, setSearch] = useState("");
  const { data: allUsers, loading, error, deactivate } = usePatients();

  const filtered = (allUsers ?? []).filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const canEdit = permissions.includes("edit_patients");
  const canDelete = permissions.includes("delete_patients");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
          <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 13 }} />
          <input
            placeholder="Search patients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9,
              padding: "9px 14px 9px 36px", color: "#111827", fontSize: 14,
              outline: "none", width: "100%", boxSizing: "border-box",
              fontFamily: "inherit", boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          />
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
              {["Patient", "Email", "Status", "Joined", ...(canEdit || canDelete ? ["Actions"] : [])].map((h) => (
                <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows cols={canEdit || canDelete ? 5 : 4} />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={canEdit || canDelete ? 5 : 4} style={{ padding: "32px 18px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No patients found</td></tr>
            ) : (
              filtered.map((u, idx) => (
                <tr
                  key={u.id}
                  style={{ borderBottom: idx < filtered.length - 1 ? "1px solid #f3f4f6" : "none", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "#f9fafb"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                >
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 9,
                        background: "#0d948818", color: "#0d9488",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, border: "1px solid #0d948833",
                      }}>{u.avatar}</div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px", fontSize: 13, color: "#6b7280" }}>{u.email}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <Badge label={u.status} color={statusColor[u.status]} bg={statusBg[u.status]} />
                  </td>
                  <td style={{ padding: "14px 18px", fontSize: 13, color: "#9ca3af" }}>{u.joined}</td>
                  {(canEdit || canDelete) && (
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {canEdit && <ActionButton><i className="fa-solid fa-pen-to-square" style={{ fontSize: 11 }} /> Edit</ActionButton>}
                        {canDelete && (
                          <ActionButton
                            variant="danger"
                            onClick={() => deactivate(u.id)}
                            disabled={u.status === "inactive"}
                          >
                            <i className="fa-solid fa-ban" style={{ fontSize: 11 }} />
                            {u.status === "inactive" ? "Inactive" : "Deactivate"}
                          </ActionButton>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
