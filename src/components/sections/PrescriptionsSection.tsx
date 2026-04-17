"use client";

import { useState } from "react";
import { Badge, ActionButton, LoadingRows, ErrorMessage, statusColor, statusBg } from "@/components/DashboardShared";
import { usePrescriptions, usePatients, useDoctors } from "@/hooks/useAdminData";
import { T } from "./themeTokens";

export default function PrescriptionsSection({ permissions }: { permissions: string[] }) {
  const { data: prescriptions, loading, error, renew, addPrescription, removePrescription } = usePrescriptions();
  const { data: doctors } = useDoctors();
  const { data: patients } = usePatients();

  const activePatients = (patients ?? []).filter(p => p.status === "active");

  const canWrite = permissions.includes("write_prescriptions");

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ patientId: "", staffId: "", medication: "", dosage: "", dosageEndDate: "" });
  const [saving, setSaving] = useState(false);
  const [modalErr, setModalErr] = useState("");

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; medication: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Renew modal state
  const [renewTarget, setRenewTarget] = useState<{ id: string; medication: string } | null>(null);
  const [renewDate, setRenewDate] = useState("");
  const [renewing, setRenewing] = useState(false);

  const handleSubmit = async () => {
    setModalErr("");
    if (!formData.patientId || !formData.staffId || !formData.medication || !formData.dosage || !formData.dosageEndDate) {
      setModalErr("All fields are required.");
      return;
    }
    setSaving(true);
    try {
      await addPrescription(formData.patientId, formData.staffId, formData.medication, formData.dosage, formData.dosageEndDate);
      setShowModal(false);
      setFormData({ patientId: "", staffId: "", medication: "", dosage: "", dosageEndDate: "" });
    } catch (e: any) {
      setModalErr(e.message || "Failed to create prescription");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removePrescription(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: any) {
      console.error("Failed to delete prescription:", err);
    } finally { setDeleting(false); }
  };

  const handleRenewSubmit = async () => {
    if (!renewTarget || !renewDate) return;
    setRenewing(true);
    try {
      await renew(renewTarget.id, renewDate);
      setRenewTarget(null);
      setRenewDate("");
    } catch (err: any) {
      console.error("Failed to renew prescription:", err);
    } finally { setRenewing(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {canWrite && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <ActionButton variant="primary" onClick={() => setShowModal(true)}>
            <i className="fa-solid fa-file-prescription" style={{ fontSize: 12 }} />
            New Prescription
          </ActionButton>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      <div style={{ background: T.tableBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, overflow: "hidden", boxShadow: T.cardShadow, backdropFilter: "blur(8px)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.tableRowBorder}`, background: T.tableHeaderBg }}>
              {["Rx ID", "Patient", "Doctor", "Medication", "Dosage", "Date", "End Date", "Status", "Actions"].map((h) => (
                <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: T.text2, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows cols={9} />
            ) : (prescriptions ?? []).length === 0 ? (
              <tr><td colSpan={9} style={{ padding: "32px 18px", textAlign: "center", color: T.text3, fontSize: 14 }}>No prescriptions found</td></tr>
            ) : (
              (prescriptions ?? []).map((rx, idx) => {
                const isExpired = rx.dosageEndDate ? new Date(rx.dosageEndDate) < new Date() : false;
                const canRenew = rx.status !== "active" || isExpired;
                return (
                <tr
                  key={rx.id}
                  style={{ borderBottom: idx < (prescriptions ?? []).length - 1 ? `1px solid ${T.tableRowBorder}` : "none", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = T.tableHoverBg}
                  onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                >
                  <td style={{ padding: "14px 18px", fontSize: 12, color: T.text3, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{rx.id}</td>
                  <td style={{ padding: "14px 18px", fontWeight: 600, fontSize: 14, color: T.text1 }}>{rx.patient}</td>
                  <td style={{ padding: "14px 18px", fontSize: 13, color: T.text2 }}>{rx.doctor}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <i className="fa-solid fa-capsules" style={{ color: T.sage, fontSize: 13 }} />
                      <span style={{ fontSize: 13, color: T.text1, fontWeight: 600 }}>{rx.medication}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px", fontSize: 12, color: T.text2 }}>
                    <span style={{ background: T.chipBg, borderRadius: 5, padding: "3px 9px", fontWeight: 500 }}>{rx.dosage}</span>
                  </td>
                  <td style={{ padding: "14px 18px", fontSize: 13, color: T.text3 }}>{new Date(rx.date).toLocaleDateString()}</td>
                  <td style={{ padding: "14px 18px", fontSize: 13, color: isExpired ? "#f87171" : T.text3, fontWeight: isExpired ? 600 : 400 }}>
                    {rx.dosageEndDate ? new Date(rx.dosageEndDate).toLocaleDateString() : "N/A"}
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <Badge label={rx.status} color={statusColor[rx.status] ?? T.text2} bg={statusBg[rx.status] ?? T.chipBg} />
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <ActionButton><i className="fa-solid fa-eye" style={{ fontSize: 11 }} /> View</ActionButton>
                      <ActionButton
                        variant="primary"
                        onClick={() => setRenewTarget({ id: rx.id, medication: rx.medication })}
                        disabled={!canRenew && rx.status === "active"}
                      >
                        <i className="fa-solid fa-arrow-rotate-right" style={{ fontSize: 11 }} /> Renew
                      </ActionButton>
                      {canWrite && (
                        <ActionButton
                          variant="danger"
                          onClick={() => setDeleteTarget({ id: rx.id, medication: rx.medication })}
                        >
                          <i className="fa-solid fa-trash-can" style={{ fontSize: 11 }} /> Remove
                        </ActionButton>
                      )}
                    </div>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {/* Write Prescription Modal */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: T.modalOverlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.modalBg, border: `1px solid ${T.modalBorder}`, borderRadius: 16, width: 420, maxWidth: "92vw", boxShadow: T.modalShadow, overflow: "hidden", backdropFilter: "blur(20px)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.modalHeaderBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.text1, fontFamily: "'Inter', sans-serif" }}>Write Prescription</div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = T.closeBtnHover}
                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
              >
                <i className="fa-solid fa-xmark" style={{ color: T.text3, fontSize: 16 }} />
              </button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.textLabel, display: "block", marginBottom: 5 }}>Patient</label>
                <select value={formData.patientId} onChange={(e) => setFormData({ ...formData, patientId: e.target.value })} style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit", color: T.text1 }}>
                  <option value="">Select Patient</option>
                  {activePatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.textLabel, display: "block", marginBottom: 5 }}>Doctor/Staff</label>
                <select value={formData.staffId} onChange={(e) => setFormData({ ...formData, staffId: e.target.value })} style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit", color: T.text1 }}>
                  <option value="">Select Doctor</option>
                  {(doctors ?? []).map(d => <option key={d.id} value={d.id}>Dr. {d.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.textLabel, display: "block", marginBottom: 5 }}>Medication Name</label>
                <input type="text" placeholder="e.g. Amoxicillin 500mg" value={formData.medication} onChange={(e) => setFormData({ ...formData, medication: e.target.value })} style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit", color: T.text1 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.textLabel, display: "block", marginBottom: 5 }}>Dosage & Instructions</label>
                <input type="text" placeholder="e.g. 1 pill twice a day for 7 days" value={formData.dosage} onChange={(e) => setFormData({ ...formData, dosage: e.target.value })} style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit", color: T.text1 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.textLabel, display: "block", marginBottom: 5 }}>Dosage End Date</label>
                <input type="date" value={formData.dosageEndDate} onChange={(e) => setFormData({ ...formData, dosageEndDate: e.target.value })} style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit", color: T.text1 }} />
              </div>
              {modalErr && (
                <div style={{ marginTop: 8, padding: "10px 14px", background: T.errorBg, border: `1px solid ${T.errorBorder}`, borderRadius: 8, color: T.errorColor, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 13 }} />
                  {modalErr}
                </div>
              )}
            </div>
            <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.modalHeaderBorder}`, display: "flex", justifyContent: "flex-end", gap: 10, background: T.modalFooterBg }}>
              <ActionButton onClick={() => setShowModal(false)}>Cancel</ActionButton>
              <ActionButton variant="primary" onClick={handleSubmit} disabled={saving}>
                {saving ? <><i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 11 }} /> Saving…</> : <><i className="fa-solid fa-check" style={{ fontSize: 11 }} /> Create</>}
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Renew Prescription Modal */}
      {renewTarget && (
        <div onClick={() => setRenewTarget(null)} style={{ position: "fixed", inset: 0, background: T.modalOverlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.modalBg, border: `1px solid ${T.modalBorder}`, borderRadius: 16, width: 400, maxWidth: "92vw", boxShadow: T.modalShadow, overflow: "hidden", backdropFilter: "blur(20px)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.modalHeaderBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.text1, fontFamily: "'Inter', sans-serif" }}>Renew Prescription</div>
              <button onClick={() => setRenewTarget(null)} style={{ background: "none", border: "none", cursor: "pointer", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = T.closeBtnHover}
                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
              >
                <i className="fa-solid fa-xmark" style={{ color: T.text3, fontSize: 16 }} />
              </button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 14, color: T.text2, lineHeight: 1.6, margin: 0 }}>
                You are renewing <strong style={{ color: T.text1 }}>{renewTarget.medication}</strong> (ID: {renewTarget.id}). Please specify the new dosage end date.
              </p>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.textLabel, display: "block", marginBottom: 5 }}>New Dosage End Date</label>
                <input type="date" value={renewDate} onChange={(e) => setRenewDate(e.target.value)} style={{ width: "100%", background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit", color: T.text1 }} />
              </div>
            </div>
            <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.modalHeaderBorder}`, display: "flex", justifyContent: "flex-end", gap: 10, background: T.modalFooterBg }}>
              <ActionButton onClick={() => setRenewTarget(null)} disabled={renewing}>Cancel</ActionButton>
              <ActionButton variant="primary" onClick={handleRenewSubmit} disabled={renewing || !renewDate}>
                {renewing ? <><i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 11 }} /> Renewing…</> : <><i className="fa-solid fa-arrow-rotate-right" style={{ fontSize: 11 }} /> Confirm Renewal</>}
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div onClick={() => setDeleteTarget(null)} style={{ position: "fixed", inset: 0, background: T.modalOverlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.modalBg, border: `1px solid ${T.modalBorder}`, borderRadius: 16, width: 400, maxWidth: "92vw", boxShadow: T.modalShadow, overflow: "hidden", backdropFilter: "blur(20px)" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.modalHeaderBorder}`, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: T.dangerBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ color: T.dangerColor, fontSize: 16 }} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.text1, fontFamily: "'Inter', sans-serif" }}>Remove Prescription</div>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <p style={{ fontSize: 14, color: T.text2, lineHeight: 1.6, margin: 0 }}>
                Are you sure you want to remove prescription <strong style={{ color: T.text1 }}>{deleteTarget.id}</strong> for <strong style={{ color: T.text1 }}>{deleteTarget.medication}</strong>? This action cannot be undone.
              </p>
            </div>
            <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.modalHeaderBorder}`, display: "flex", justifyContent: "flex-end", gap: 10, background: T.modalFooterBg }}>
              <ActionButton onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</ActionButton>
              <ActionButton variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? <><i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 11 }} /> Removing…</> : <><i className="fa-solid fa-trash-can" style={{ fontSize: 11 }} /> Remove</>}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
