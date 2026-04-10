"use client";

import { useState, Fragment, useRef, useEffect } from "react";
import { Badge, ActionButton, LoadingRows, ErrorMessage, statusColor, statusBg } from "@/components/DashboardShared";
import { useAppointments, usePatients, useUsers } from "@/hooks/useAdminData";

export default function AppointmentsSection({ permissions }: { permissions: string[] }) {
  const { data: appointments, loading, error, cancel, addAppointment } = useAppointments();
  const { data: patients } = usePatients();
  const { data: users } = useUsers();

  const activeStaff = (users ?? []).filter(u => u.status === "active" && (u.role === "staff" || u.role === "admin"));
  const activePatients = (patients ?? []).filter(p => p.status === "active");

  const canCreate = permissions.includes("create_appointments");
  const canCancel = permissions.includes("cancel_appointments");

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ patientId: "", staffId: "", date: "", time: "", type: "General Checkup" });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerHour, setPickerHour] = useState("12");
  const [pickerMinute, setPickerMinute] = useState("00");
  const [pickerPeriod, setPickerPeriod] = useState("PM");
  const [saving, setSaving] = useState(false);
  const [modalErr, setModalErr] = useState("");

  const hoursList = Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0'));
  const minutesList = Array.from({length: 60}, (_, i) => String(i).padStart(2, '0'));

  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTimePicker) {
      if (hourRef.current) hourRef.current.scrollTop = hoursList.indexOf(pickerHour) * 22;
      if (minRef.current) minRef.current.scrollTop = minutesList.indexOf(pickerMinute) * 22;
      if (periodRef.current) periodRef.current.scrollTop = ["AM", "PM"].indexOf(pickerPeriod) * 22;
    }
  }, [showTimePicker]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>, list: string[], setter: (val: string) => void) => {
    const el = e.currentTarget;
    const index = Math.round(el.scrollTop / 22);
    if (list[index]) setter(list[index]);
  };

  const typeBuffer = useRef("");
  const typeTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, list: string[], ref: React.RefObject<HTMLDivElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (ref.current) ref.current.scrollBy({ top: -22, behavior: "smooth" });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (ref.current) ref.current.scrollBy({ top: 22, behavior: "smooth" });
    } else if (/^[a-zA-Z0-9]$/.test(e.key)) {
      e.preventDefault();
      typeBuffer.current += e.key.toUpperCase();
      
      let idx = list.findIndex(item => item === typeBuffer.current);
      if (idx === -1) idx = list.findIndex(item => item.startsWith(typeBuffer.current));

      if (idx !== -1 && ref.current) {
        // "scroll option is not used", so we jump instantly via auto behavior
        ref.current.scrollTo({ top: idx * 22, behavior: "auto" });
      }
      
      if (typeTimeout.current) clearTimeout(typeTimeout.current);
      typeTimeout.current = setTimeout(() => { typeBuffer.current = ""; }, 750);
    }
  };

  const openTimePicker = () => {
    if (formData.time) {
      const [h, m] = formData.time.split(":");
      let hNum = parseInt(h, 10);
      const isPM = hNum >= 12;
      if (hNum === 0) hNum = 12;
      else if (hNum > 12) hNum -= 12;
      setPickerHour(String(hNum).padStart(2, '0'));
      setPickerMinute(m || "00");
      setPickerPeriod(isPM ? "PM" : "AM");
    } else {
      setPickerHour("12");
      setPickerMinute("00");
      setPickerPeriod("PM");
    }
    setShowTimePicker(true);
  };

  const confirmTime = () => {
    let h24 = parseInt(pickerHour, 10);
    if (pickerPeriod === "AM" && h24 === 12) h24 = 0;
    else if (pickerPeriod === "PM" && h24 < 12) h24 += 12;
    const newTime = `${String(h24).padStart(2, '0')}:${pickerMinute}`;
    setFormData({ ...formData, time: newTime });
    setShowTimePicker(false);
  };

  const handleSubmit = async () => {
    setModalErr("");
    if (!formData.patientId || !formData.staffId || !formData.date || !formData.time) {
      setModalErr("Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      const datetime = `${formData.date}T${formData.time}:00`;
      await addAppointment(formData.patientId, formData.staffId, datetime, formData.type);
      setShowModal(false);
      setFormData({ patientId: "", staffId: "", date: "", time: "", type: "General Checkup" });
    } catch (e: any) {
      setModalErr(e.message || "Failed to create appointment");
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {canCreate && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <ActionButton variant="primary" onClick={() => setShowModal(true)}>
            <i className="fa-solid fa-calendar-plus" style={{ fontSize: 12 }} />
            New Appointment
          </ActionButton>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f3f4f6", background: "#f9fafb" }}>
              {["ID", "Patient", "Doctor", "Date", "Time", "Type", "Status", ...(canCancel ? ["Actions"] : [])].map((h) => (
                <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows cols={canCancel ? 8 : 7} />
            ) : (appointments ?? []).length === 0 ? (
              <tr><td colSpan={canCancel ? 8 : 7} style={{ padding: "32px 18px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No appointments found</td></tr>
            ) : (
              (appointments ?? []).map((apt, idx) => (
                <tr
                  key={apt.id}
                  style={{ borderBottom: idx < (appointments ?? []).length - 1 ? "1px solid #f3f4f6" : "none", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "#f9fafb"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                >
                  <td style={{ padding: "14px 18px", fontSize: 12, color: "#9ca3af", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{apt.id.split('-')[0].toUpperCase()}</td>
                  <td style={{ padding: "14px 18px", fontWeight: 600, fontSize: 14, color: "#111827" }}>{apt.patient}</td>
                  <td style={{ padding: "14px 18px", fontSize: 13, color: "#6b7280" }}>{apt.doctor}</td>
                  <td style={{ padding: "14px 18px", fontSize: 13, color: "#9ca3af" }}>{apt.date}</td>
                  <td style={{ padding: "14px 18px", fontWeight: 700, fontSize: 14, color: "#374151" }}>{apt.time}</td>
                  <td style={{ padding: "14px 18px" }}>
                    <span style={{ background: "#f3f4f6", borderRadius: 5, padding: "3px 9px", fontSize: 12, fontWeight: 500, color: "#374151" }}>{apt.type}</span>
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <Badge label={apt.status} color={statusColor[apt.status]} bg={statusBg[apt.status]} />
                  </td>
                  {canCancel && (
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <ActionButton><i className="fa-solid fa-eye" style={{ fontSize: 11 }} /> View</ActionButton>
                        <ActionButton
                          variant="danger"
                          onClick={() => cancel(apt.id)}
                          disabled={apt.status === "cancelled" || apt.status === "completed"}
                        >
                          <i className="fa-solid fa-ban" style={{ fontSize: 11 }} /> Cancel
                        </ActionButton>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Appointment Modal */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(3px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: 420, maxWidth: "92vw", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", fontFamily: "'Outfit', sans-serif" }}>New Appointment</div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6"}
                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
              >
                <i className="fa-solid fa-xmark" style={{ color: "#9ca3af", fontSize: 16 }} />
              </button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Patient</label>
                <select value={formData.patientId} onChange={(e) => setFormData({ ...formData, patientId: e.target.value })} style={{ width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }}>
                  <option value="">Select Patient</option>
                  {activePatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Doctor/Staff</label>
                <select value={formData.staffId} onChange={(e) => setFormData({ ...formData, staffId: e.target.value })} style={{ width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }}>
                  <option value="">Select Staff</option>
                  {activeStaff.map(s => <option key={s.id} value={s.id}>Dr. {s.name}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} style={{ width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                </div>
                <div style={{ flex: 1, position: "relative" }}>
                  <style>{`
                    .custom-time::-webkit-calendar-picker-indicator { display: none; }
                    .time-col::-webkit-scrollbar { width: 4px; }
                    .time-col::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
                  `}</style>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Time</label>
                  <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "0 10px" }}
                       onFocus={(e) => e.currentTarget.style.borderColor = "#0d9488"}
                       onBlur={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}>
                    <input type="time" className="custom-time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} style={{ width: "100%", border: "none", padding: "10px 0", fontSize: 13, outline: "none", fontFamily: "inherit", background: "transparent" }} />
                    <button type="button" onClick={(e) => { e.preventDefault(); openTimePicker(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px", outline: "none", display: "flex", alignItems: "center", justifyContent: "center" }} title="Open Time Picker">
                      <i className="fa-solid fa-clock" style={{ fontSize: 15 }} />
                    </button>
                  </div>
                  {showTimePicker && (
                    <>
                      <div style={{ position: "fixed", inset: 0, zIndex: 1001 }} onClick={() => setShowTimePicker(false)} />
                      <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 8px 20px rgba(0,0,0,0.1)", zIndex: 1002, width: "max-content", padding: "10px 14px", display: "flex", alignItems: "flex-end", gap: 6, overflowY: "hidden" }}>
                        
                        <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "flex-end" }}>
                          <style>{`
                            .time-col::-webkit-scrollbar { display: none; }
                            .time-col:focus { outline: 1.5px solid #0d9488; border-color: #0d9488; }
                          `}</style>
                          
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 2 }}>HR</div>
                            <div className="time-col" tabIndex={0} ref={hourRef} onScroll={(e) => handleScroll(e, hoursList, setPickerHour)} onKeyDown={(e) => handleKeyDown(e, hoursList, hourRef)} style={{ height: 22, width: 48, overflowY: "hidden", scrollSnapType: "y mandatory", scrollbarWidth: "none", msOverflowStyle: "none", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, transition: "border 0.2s" }}>
                              {hoursList.map(h => (
                                <div key={h} style={{ flex: "0 0 22px", height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#111827", scrollSnapAlign: "start" }}>{h}</div>
                              ))}
                            </div>
                          </div>

                          <div style={{ fontSize: 15, fontWeight: 700, color: "#9ca3af", marginBottom: 3 }}>:</div>

                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 2 }}>MIN</div>
                            <div className="time-col" tabIndex={0} ref={minRef} onScroll={(e) => handleScroll(e, minutesList, setPickerMinute)} onKeyDown={(e) => handleKeyDown(e, minutesList, minRef)} style={{ height: 22, width: 48, overflowY: "hidden", scrollSnapType: "y mandatory", scrollbarWidth: "none", msOverflowStyle: "none", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, transition: "border 0.2s" }}>
                              {minutesList.map(m => (
                                <div key={m} style={{ flex: "0 0 22px", height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#111827", scrollSnapAlign: "start" }}>{m}</div>
                              ))}
                            </div>
                          </div>

                          <div style={{ width: 2 }} />

                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 2 }}>AM/PM</div>
                            <div className="time-col" tabIndex={0} ref={periodRef} onScroll={(e) => handleScroll(e, ["AM", "PM"], setPickerPeriod)} onKeyDown={(e) => handleKeyDown(e, ["AM", "PM"], periodRef)} style={{ height: 22, width: 48, overflowY: "hidden", scrollSnapType: "y mandatory", scrollbarWidth: "none", msOverflowStyle: "none", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, transition: "border 0.2s" }}>
                              {["AM", "PM"].map(p => (
                                <div key={p} style={{ flex: "0 0 22px", height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#111827", scrollSnapAlign: "start" }}>{p}</div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div style={{ paddingLeft: 4, display: "flex", alignItems: "center" }}>
                           <button type="button" onClick={confirmTime} style={{ background: "#0d9488", color: "#fff", border: "none", width: 26, height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" }} title="Set Time" onMouseEnter={e => e.currentTarget.style.background = "#0f766e"} onMouseLeave={e => e.currentTarget.style.background = "#0d9488"}>
                              <i className="fa-solid fa-check" style={{ fontSize: 12 }} />
                           </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} style={{ width: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "10px 14px", fontSize: 13, outline: "none", fontFamily: "inherit" }}>
                  {["General Checkup", "Follow-Up", "Consultation", "Emergency", "Lab Test"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {modalErr && (
                <div style={{ marginTop: 8, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: 8, color: "#dc2626", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 13 }} />
                  {modalErr}
                </div>
              )}
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 10, background: "#f9fafb", borderRadius: "0 0 16px 16px" }}>
              <ActionButton onClick={() => setShowModal(false)}>Cancel</ActionButton>
              <ActionButton variant="primary" onClick={handleSubmit} disabled={saving}>
                {saving ? <><i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 11 }} /> Saving…</> : <><i className="fa-solid fa-check" style={{ fontSize: 11 }} /> Create</>}
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
