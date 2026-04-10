"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Badge, ActionButton, LoadingRows, ErrorMessage, statusColor, statusBg, roleColor } from "@/components/DashboardShared";
import { usePatients, useUsers } from "@/hooks/useAdminData";
import type { User } from "@/hooks/types";

export default function PatientsSection({ permissions }: { permissions: string[] }) {
  const { data: session } = useSession();
  const activeName = session?.user?.name || "Unknown Admin";

  const [search, setSearch] = useState("");
  const [actionErr, setActionErr] = useState("");
  const { data: allUsers, loading, error, removePatient } = usePatients();

  const [deletingEntity, setDeletingEntity] = useState<User | null>(null);
  const [authChallenge, setAuthChallenge] = useState(false);
  const [authInput, setAuthInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const expectedAuthString = deletingEntity ? `${activeName} - ${deletingEntity.name}` : "";

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

      {actionErr && <ErrorMessage message={actionErr} />}
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
                            onClick={() => {
                              setActionErr("");
                              setDeletingEntity(u);
                              setAuthChallenge(false);
                              setAuthInput("");
                            }}
                          >
                            <i className="fa-solid fa-trash" style={{ fontSize: 11 }} /> Delete
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

      {deletingEntity && (
        <div
          onClick={() => { setDeletingEntity(null); setAuthChallenge(false); }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 16, width: 400, maxWidth: "90vw",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 14 }} />
                </div>
                {authChallenge ? "Authentication Required" : "Confirm Deletion"}
              </div>
              <button 
                onClick={() => { setDeletingEntity(null); setAuthChallenge(false); }}
                style={{ background: "none", border: "none", cursor: "pointer", width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <i className="fa-solid fa-xmark" style={{ color: "#9ca3af", fontSize: 16 }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px" }}>
              {!authChallenge ? (
                <>
                  <p style={{ margin: 0, fontSize: 15, color: "#4b5563", lineHeight: 1.5 }}>
                    Are you absolutely sure you want to permanently delete <strong>{deletingEntity.name}</strong>?
                  </p>
                  <p style={{ margin: "12px 0 0", fontSize: 13, color: "#6b7280" }}>
                    This action cannot be undone. Any compliant historical records mapped here might cascade.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ margin: "0 0 16px", fontSize: 14, color: "#4b5563" }}>
                    To authorize this deletion, please type the following confirmation signature exactly as it appears below:
                  </p>
                  <div style={{ background: "#f3f4f6", padding: "10px 14px", borderRadius: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#111827", fontWeight: 600, letterSpacing: "-0.01em", userSelect: "all", marginBottom: 16, border: "1px dashed #d1d5db" }}>
                    {expectedAuthString}
                  </div>
                  <input
                    autoFocus
                    placeholder="Type signature here..."
                    value={authInput}
                    onChange={(e) => setAuthInput(e.target.value)}
                    style={{
                      width: "100%", background: "#fff", border: authInput === expectedAuthString ? "1px solid #10b981" : "1px solid #d1d5db", 
                      borderRadius: 8, padding: "12px 14px", fontSize: 14, outline: "none", fontFamily: "'JetBrains Mono', monospace",
                      boxSizing: "border-box", transition: "border 0.2s"
                    }}
                  />
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #f3f4f6", background: "#f9fafb", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <ActionButton onClick={() => { setDeletingEntity(null); setAuthChallenge(false); }}>
                Cancel
              </ActionButton>
              {!authChallenge ? (
                <ActionButton variant="primary" onClick={() => setAuthChallenge(true)}>
                  Proceed <i className="fa-solid fa-arrow-right" style={{ fontSize: 11, marginLeft: 4 }} />
                </ActionButton>
              ) : (
                <ActionButton
                  variant="danger"
                  disabled={authInput !== expectedAuthString || isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await removePatient(deletingEntity.id);
                      setDeletingEntity(null);
                      setAuthChallenge(false);
                    } catch(err: any) {
                      setActionErr(err.message || "Failed to delete patient");
                      setDeletingEntity(null);
                      setAuthChallenge(false);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                >
                  {isDeleting ? <i className="fa-solid fa-circle-notch fa-spin" /> : <i className="fa-solid fa-trash" />} Confirm Delete
                </ActionButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
