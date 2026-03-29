"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaHospital,
  FaThLarge,
  FaClipboardList,
  FaUserInjured,
  FaCalendarAlt,
  FaBox,
  FaCreditCard,
  FaRegQuestionCircle,
  FaCog,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaUserCircle,
  FaTimes,
  FaWhatsapp,
  FaFileMedicalAlt,
  FaHeartbeat,
  FaStethoscope,
  FaNotesMedical,
} from "react-icons/fa";
import { useTheme } from "@/hooks/useTheme";

export default function StaffDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const { isDark, toggleTheme } = useTheme();

  const [doctors, setDoctors] = useState([
    { name: "Dr. Dianne Russell", checked: true },
    { name: "Dr. Marvin McKinney", checked: true },
    { name: "Dr. Floyd Miles", checked: true },
    { name: "Dr. Wade Warren", checked: true },
    { name: "Dr. Savannah Nguyen", checked: false },
    { name: "Dr. Leslie Alexander", checked: false },
  ]);

  const [consultTypes, setConsultTypes] = useState([
    { name: "General Check-up", checked: true },
    { name: "Cardiology", checked: false },
    { name: "Pediatrics", checked: true },
    { name: "Dermatology", checked: true },
    { name: "Orthopedics", checked: false },
    { name: "Neurology", checked: false },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<{
    name: string;
    type: string;
  } | null>(null);

  const toggleDoctor = (index: number) => {
    const newDocs = [...doctors];
    newDocs[index].checked = !newDocs[index].checked;
    setDoctors(newDocs);
  };

  const toggleConsult = (index: number) => {
    const newTypes = [...consultTypes];
    newTypes[index].checked = !newTypes[index].checked;
    setConsultTypes(newTypes);
  };

  const handleOpenModal = (name: string, type: string) => {
    setSelectedAppointment({ name, type });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  if (status === "loading" || !session) {
    return (
      <div className="flex bg-gray-50 dark:bg-slate-800 min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  const patientQueue = [
    { name: "James Jacob", time: "14 Jan 2023", type: "General Check-up", img: "https://i.pravatar.cc/150?u=1" },
    { name: "Courtney Henry", time: "14 Jan 2023", type: "Dermatology", img: "https://i.pravatar.cc/150?u=2" },
    { name: "Jerome Bell", time: "16 Jan 2023", type: "Cardiology", img: "https://i.pravatar.cc/150?u=3" },
    { name: "Esther Howard", time: "17 Jan 2023", type: "Pediatrics", img: "https://i.pravatar.cc/150?u=4" },
    { name: "Devon Lane", time: "18 Jan 2023", type: "Orthopedics", img: "https://i.pravatar.cc/150?u=5" },
    { name: "Ibrahimovic", time: "19 Jan 2023", type: "Neurology", img: "https://i.pravatar.cc/150?u=6" },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200 font-sans overflow-hidden">

      {/* ═══════════════════════════════════════════════════════
          1) SIDEBAR ICON NAVIGATION
         ═══════════════════════════════════════════════════════ */}
      <nav className="w-20 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 flex flex-col items-center py-6 justify-between z-20 shrink-0">
        <div className="flex flex-col items-center space-y-8 w-full">
          {/* Logo */}
          <div className="text-teal-600 dark:text-teal-400 text-3xl mb-4">
            <FaHospital />
          </div>

          {/* Menu Items */}
          <div className="w-full flex flex-col items-center space-y-6">
            <button className="text-gray-400 dark:text-slate-500 hover:text-teal-600 dark:text-teal-400 transition-colors p-3 rounded-xl hover:bg-slate-50 dark:bg-slate-900">
              <FaThLarge className="w-5 h-5" />
            </button>
            <button className="text-gray-400 dark:text-slate-500 hover:text-teal-600 dark:text-teal-400 transition-colors p-3 rounded-xl hover:bg-slate-50 dark:bg-slate-900">
              <FaClipboardList className="w-5 h-5" />
            </button>
            <button className="text-gray-400 dark:text-slate-500 hover:text-teal-600 dark:text-teal-400 transition-colors p-3 rounded-xl hover:bg-slate-50 dark:bg-slate-900">
              <FaUserInjured className="w-5 h-5" />
            </button>
            <button className="text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30/80 dark:bg-teal-900/50 p-3 rounded-xl shadow-sm border border-teal-100 dark:border-teal-800/50/50 dark:border-teal-800/50 relative">
              <FaCalendarAlt className="w-5 h-5" />
              <div className="absolute top-1/2 -right-1 w-1 h-8 bg-teal-500 rounded-l-full -translate-y-1/2" />
            </button>
            <button className="text-gray-400 dark:text-slate-500 hover:text-teal-600 dark:text-teal-400 transition-colors p-3 rounded-xl hover:bg-slate-50 dark:bg-slate-900">
              <FaBox className="w-5 h-5" />
            </button>
            <button className="text-gray-400 dark:text-slate-500 hover:text-teal-600 dark:text-teal-400 transition-colors p-3 rounded-xl hover:bg-slate-50 dark:bg-slate-900">
              <FaCreditCard className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-6 w-full mt-auto">
          <button onClick={toggleTheme} className="text-gray-400 dark:text-slate-500 hover:text-teal-600 dark:text-teal-400 transition-colors" title="Toggle Theme">
            {isDark ? (
              <i className="fa-solid fa-sun text-amber-500 hover:text-amber-400 text-lg" />
            ) : (
              <i className="fa-solid fa-moon text-gray-500 hover:text-indigo-400 text-lg" />
            )}
          </button>
          <button className="text-gray-400 dark:text-slate-500 hover:text-teal-600 dark:text-teal-400 transition-colors">
            <FaRegQuestionCircle className="w-5 h-5" />
          </button>
          <button className="text-gray-400 dark:text-slate-500 hover:text-teal-600 dark:text-teal-400 transition-colors">
            <FaCog className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="text-gray-400 dark:text-slate-500 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <img
              src={`https://ui-avatars.com/api/?name=${session.user?.name}&background=0D9488&color=fff`}
              alt="Profile"
              className="w-8 h-8 rounded-full shadow-sm mt-4 border border-gray-200 dark:border-slate-700"
            />
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════
          2) LISTS PANEL (Available Doctor, Queue)
         ═══════════════════════════════════════════════════════ */}
      <aside className="w-64 bg-slate-50 dark:bg-slate-900/60 dark:bg-slate-900/40 border-r border-gray-200 dark:border-slate-700 flex flex-col h-full shrink-0">

        {/* Header Spacer */}
        <div className="h-20" />

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 px-6 pb-6">

          {/* Available Doctors */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-widest mb-4 uppercase">
              Available Doctors
            </h3>
            <div className="space-y-3.5">
              {doctors.map((doc, i) => (
                <label
                  key={i}
                  className="flex items-center space-x-3 cursor-pointer group"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDoctor(i);
                  }}
                >
                  <div
                    className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${doc.checked
                        ? "bg-teal-500 border-teal-500 text-white"
                        : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-teal-400"
                      }`}
                  >
                    {doc.checked && <FaCheck className="w-2.5 h-2.5" />}
                  </div>
                  <span
                    className={`text-sm tracking-tight ${doc.checked ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-slate-500"
                      }`}
                  >
                    {doc.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Consultation Type */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-widest mb-4 uppercase">
              Consultation Type
            </h3>
            <div className="space-y-3.5">
              {consultTypes.map((type, i) => (
                <label
                  key={i}
                  className="flex items-center space-x-3 cursor-pointer group"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleConsult(i);
                  }}
                >
                  <div
                    className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${type.checked
                        ? "bg-teal-500 border-teal-500 text-white"
                        : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-teal-400"
                      }`}
                  >
                    {type.checked && <FaCheck className="w-2.5 h-2.5" />}
                  </div>
                  <span
                    className={`text-sm tracking-tight ${type.checked ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-slate-500"
                      }`}
                  >
                    {type.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Patient Queue */}
          <div className="flex-1 mt-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-widest uppercase">
                Patient Queue
              </h3>
              <span className="bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 dark:text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                6
              </span>
            </div>
            <div className="space-y-4">
              {patientQueue.map((patient, i) => (
                <div key={i} className="flex items-center gap-3">
                  <img
                    src={patient.img}
                    alt={patient.name}
                    className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 tracking-tight leading-tight">
                      {patient.name}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                      {patient.time} • {patient.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════
          3) MAIN CONTENT: CALENDAR VIEW
         ═══════════════════════════════════════════════════════ */}
      <main className="flex-1 bg-white dark:bg-slate-800 flex flex-col h-full relative overflow-hidden">

        {/* Top Header */}
        <header className="h-20 flex items-center px-8 justify-between shrink-0 border-b border-gray-100 dark:border-slate-700/50 dark:border-slate-700/50">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Appointments
          </h1>

          <div className="flex items-center gap-6">
            <div className="relative w-72">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search appointment..."
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 rounded-full outline-none text-sm placeholder:text-gray-400 dark:text-slate-500 focus:ring-2 ring-teal-500/20 transition-all border border-gray-200 dark:border-slate-700"
              />
            </div>
            <button className="w-9 h-9 rounded-full border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-500 dark:text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:bg-slate-800 transition-colors shadow-sm">
              <FaTimes className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Calendar Body */}
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* Calendar Controller Header */}
          <div className="flex items-end justify-between px-8 py-5 border-b border-gray-100 dark:border-slate-700 shrink-0">
            <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
              <FaCalendarAlt className="text-gray-400 dark:text-slate-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                January 2023
              </span>
              <div className="flex items-center gap-1 ml-2 text-gray-400 dark:text-slate-500">
                <button className="hover:text-teal-600 dark:text-teal-400 transition-colors">
                  <FaChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button className="hover:text-teal-600 dark:text-teal-400 transition-colors">
                  <FaChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex absolute left-32 bottom-2 text-xs text-gray-400 dark:text-slate-500 font-medium">
              GMT+7
            </div>

            <div className="flex gap-20 flex-1 ml-40 justify-center">
              <div className="text-center">
                <p className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-slate-500 uppercase">
                  Sun
                </p>
                <p className="text-xl font-medium text-gray-800 dark:text-gray-200 mt-1">14</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-slate-500 uppercase">
                  Mon
                </p>
                <p className="text-xl font-medium text-gray-800 dark:text-gray-200 mt-1">15</p>
              </div>
            </div>
          </div>

          {/* Grid Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            <div className="grid grid-cols-[80px_1fr_1fr] min-h-[800px] border-b border-gray-100 dark:border-slate-700">
              {/* Time Column */}
              <div className="border-r border-gray-100 dark:border-slate-700 relative">
                {["09.00AM", "10.00AM", "11.00AM", "12.00PM", "01.00PM"].map(
                  (time, i) => (
                    <div key={i} className="h-32 relative border-b border-gray-50">
                      <span className="absolute -top-3 left-4 text-[11px] text-gray-400 dark:text-slate-500 font-medium bg-white dark:bg-slate-800 px-1 z-10">
                        {time}
                      </span>
                    </div>
                  )
                )}
                {/* Current time line indicator */}
                <div className="absolute top-[280px] w-full border-t border-dashed border-teal-400 z-10">
                  <div className="absolute -left-6 -top-[11px] bg-teal-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                    11.48
                  </div>
                </div>
              </div>

              {/* Day 1 Grid */}
              <div className="border-r border-gray-100 dark:border-slate-700 relative pt-3 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="absolute w-full h-[1px] bg-gray-50 dark:bg-slate-800" />
                ))}

                {/* Appointment Block 1 */}
                <div
                  onClick={() => handleOpenModal("Courtney Henry", "Cardiology")}
                  className="absolute top-4 left-2 right-2 h-28 bg-teal-50 dark:bg-teal-900/30/70 dark:bg-teal-900/40 border border-teal-100 dark:border-teal-800/50/50 dark:border-teal-800/50 rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src="https://i.pravatar.cc/150?u=2"
                      className="w-6 h-6 rounded-full"
                      alt="Courtney"
                    />
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      Courtney He...
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">Cardiology</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-slate-500 mt-1">
                      09.00 AM - 11.00 AM
                    </p>
                  </div>
                  <div className="absolute bottom-3 right-3 flex -space-x-2">
                    <img
                      src="https://i.pravatar.cc/150?u=12"
                      className="w-5 h-5 rounded-full border border-white dark:border-slate-800"
                    />
                    <img
                      src="https://i.pravatar.cc/150?u=13"
                      className="w-5 h-5 rounded-full border border-white dark:border-slate-800"
                    />
                    <div className="w-5 h-5 rounded-full border border-white dark:border-slate-800 bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold text-gray-600 dark:text-gray-400 dark:text-slate-500">
                      3+
                    </div>
                  </div>
                </div>

                {/* Appointment Block 2 */}
                <div
                  onClick={() => handleOpenModal("Jerome Bell", "Pediatrics")}
                  className="absolute top-[140px] left-2 right-2 h-28 bg-purple-50/70 dark:bg-purple-900/40 border border-purple-100/50 dark:border-purple-800/30 rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src="https://i.pravatar.cc/150?u=3"
                      className="w-6 h-6 rounded-full"
                      alt="Jerome"
                    />
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      Jerome Bell
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Pediatrics</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-slate-500 mt-1">
                      10.00 AM - 11.00 AM
                    </p>
                  </div>
                  <div className="absolute bottom-3 right-3 flex -space-x-2">
                    <img
                      src="https://i.pravatar.cc/150?u=14"
                      className="w-5 h-5 rounded-full border border-white dark:border-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Day 2 Grid */}
              <div className="relative pt-3 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="absolute w-full h-[1px] bg-gray-50 dark:bg-slate-800" />
                ))}

                {/* Appointment Block 3 */}
                <div
                  onClick={() => handleOpenModal("Jenny", "Dermatology")}
                  className="absolute top-[140px] left-2 right-4 h-24 bg-emerald-50/70 dark:bg-emerald-900/40 border border-emerald-100/50 dark:border-emerald-800/30 rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src="https://i.pravatar.cc/150?u=7"
                      className="w-6 h-6 rounded-full"
                      alt="Jenny"
                    />
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      Jenny
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Dermatology
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-slate-500 mt-1">
                      09.00 AM - 12.00 PM
                    </p>
                  </div>
                  <div className="absolute bottom-3 right-3 flex -space-x-2">
                    <img
                      src="https://i.pravatar.cc/150?u=15"
                      className="w-5 h-5 rounded-full border border-white dark:border-slate-800"
                    />
                    <img
                      src="https://i.pravatar.cc/150?u=16"
                      className="w-5 h-5 rounded-full border border-white dark:border-slate-800"
                    />
                  </div>
                </div>

                {/* Appointment Block 4 */}
                <div
                  onClick={() => handleOpenModal("Guy", "General Check-up")}
                  className="absolute top-[390px] left-2 right-4 h-28 bg-teal-50 dark:bg-teal-900/30/70 dark:bg-teal-900/40 border border-teal-100 dark:border-teal-800/50/50 dark:border-teal-800/50 rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src="https://i.pravatar.cc/150?u=8"
                      className="w-6 h-6 rounded-full"
                      alt="Guy"
                    />
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      Guy
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                      General Check-up
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-slate-500 mt-1">
                      12.00 PM - 02.00 PM
                    </p>
                  </div>
                  <div className="absolute bottom-3 right-3 flex -space-x-2">
                    <img
                      src="https://i.pravatar.cc/150?u=17"
                      className="w-5 h-5 rounded-full border border-white dark:border-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Current time line extending across grid */}
              <div className="absolute top-[280px] left-[80px] right-0 border-t border-dashed border-teal-300 dark:border-teal-600 z-10 pointer-events-none origin-left opacity-60" />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            4) OVERLAY: REQUEST APPOINTMENT MODAL
           ═══════════════════════════════════════════════════════ */}
        {isModalOpen && (
          <div className="absolute right-6 top-6 w-[450px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl dark:shadow-none border border-gray-100 dark:border-slate-700 flex flex-col z-30 max-h-[calc(100%-48px)] overflow-hidden">

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between shrink-0 bg-white dark:bg-slate-800 z-10">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                  Request Appointment
                </h2>
                <span className="bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 dark:text-slate-500 text-[10px] px-2 py-0.5 rounded-md font-bold">
                  ID #202324
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">3 of 12</span>
                <div className="flex gap-1">
                  <button className="w-7 h-7 rounded border border-gray-200 dark:border-slate-700 flex items-center justify-center hover:bg-gray-50 dark:bg-slate-800 transition-colors">
                    <FaChevronLeft className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400 dark:text-slate-500" />
                  </button>
                  <button className="w-7 h-7 rounded border border-gray-200 dark:border-slate-700 flex items-center justify-center hover:bg-gray-50 dark:bg-slate-800 transition-colors">
                    <FaChevronRight className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400 dark:text-slate-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar bg-white dark:bg-slate-800">

              {/* Personal Detail */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
                  Personal Detail
                </h3>
                <div className="border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm bg-white dark:bg-slate-800">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src="https://i.pravatar.cc/150?u=3"
                      className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"
                      alt={selectedAppointment?.name || "Jerome"}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">
                        {selectedAppointment?.name || "Jerome Bellingham"}
                      </h4>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500 dark:text-gray-400 dark:text-slate-500">
                        <span className="flex items-center gap-1.5 hover:text-teal-600 dark:text-teal-400 transition-colors cursor-pointer">
                          <FaPhoneAlt className="w-3 h-3 text-gray-400 dark:text-slate-500" /> +62 837 356 343 23
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="flex items-center gap-1.5 hover:text-teal-600 dark:text-teal-400 transition-colors cursor-pointer">
                          <FaEnvelope className="w-3 h-3 text-gray-400 dark:text-slate-500" /> jeromebellingham93@mail.com
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/80 dark:border-slate-700 rounded-lg p-3 relative mb-4">
                    <span className="absolute -top-2 left-3 bg-slate-50 dark:bg-slate-900 px-1 text-[10px] text-gray-400 dark:text-slate-500 font-semibold tracking-wide border-x border-slate-100 dark:border-slate-700">
                      Chief Complaint
                    </span>
                    <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed pt-1">
                      Patient reports persistent chest discomfort and shortness of breath during moderate physical activity over the past two weeks.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-1">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 dark:text-slate-500 flex items-center gap-1.5 mb-2">
                        <FaHeartbeat className="text-gray-400 dark:text-slate-500 w-3 h-3" /> Diagnosis
                      </p>
                      <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                        Suspected hypertension, mild arrhythmia, fatigue
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 dark:text-slate-500 flex items-center gap-1.5 mb-2">
                        <FaNotesMedical className="text-gray-400 dark:text-slate-500 w-3 h-3" /> Prescribed Medication
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] border border-gray-200 dark:border-slate-700 px-2 py-1 rounded bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 dark:text-slate-500 font-medium whitespace-nowrap">
                          Amlodipine 5mg
                        </span>
                        <span className="text-[10px] border border-gray-200 dark:border-slate-700 px-2 py-1 rounded bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 dark:text-slate-500 font-medium whitespace-nowrap">
                          Bisoprolol 2.5mg
                        </span>
                        <span className="text-[10px] border border-gray-200 dark:border-slate-700 px-2 py-1 rounded bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 dark:text-slate-500 font-medium whitespace-nowrap">
                          Aspirin 100mg
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
                  Booking Information
                </h3>
                <div className="border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm grid grid-cols-2 gap-4 bg-white dark:bg-slate-800">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 dark:text-slate-500 flex items-center gap-1.5 mb-2">
                      <FaCalendarAlt className="text-gray-400 dark:text-slate-500 w-3 h-3" /> Date
                    </p>
                    <p className="text-[13px] text-gray-900 dark:text-gray-100 font-medium leading-relaxed">
                      Thursday, 12 November, 09.00 AM - 10.00 AM
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 dark:text-slate-500 flex items-center gap-1.5 mb-2">
                      <FaStethoscope className="text-gray-400 dark:text-slate-500 w-3 h-3" /> Consultation Type
                    </p>
                    <span className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800/50 text-green-700 dark:text-green-300 text-[11px] px-2.5 py-1 rounded-md font-medium mt-1">
                      <FaWhatsapp className="w-3.5 h-3.5 text-green-600" /> Chat WhatsApp
                    </span>
                  </div>
                </div>
              </div>

              {/* Planning Schedule */}
              <div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
                  Care Plan Schedule
                </h3>

                <div className="relative pl-3 space-y-4 before:absolute before:left-[17px] before:top-2 before:bottom-6 before:w-[2px] before:bg-gray-100 dark:bg-slate-700">

                  {/* Timeline item 1 */}
                  <div className="relative">
                    <div className="absolute -left-[18px] top-0 w-3 h-3 rounded-full border-[3px] border-white dark:border-slate-800 bg-teal-500 shadow-sm z-10" />
                    <div className="flex items-center gap-3 mb-2 px-6">
                      <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                        12 Oct 2023
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                        10:30 AM
                      </span>
                    </div>
                    <div className="ml-6 border border-teal-100 dark:border-teal-800/50 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:border-teal-300 dark:border-teal-600 transition-colors">
                      <h4 className="text-[13px] font-bold text-teal-600 dark:text-teal-400 mb-3">
                        Initial Consultation & ECG
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-slate-500 mb-1 flex items-center gap-1">
                            <FaUserCircle className="text-gray-400 dark:text-slate-500" /> Doctor
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-800 dark:text-gray-200 font-medium">
                            <img
                              src="https://i.pravatar.cc/150?u=18"
                              className="w-4 h-4 rounded-full"
                            />{" "}
                            Dr. Dianne Rachel
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-slate-500 mb-1 flex items-center gap-1">
                            <FaUserCircle className="text-gray-400 dark:text-slate-500" /> Nurse
                          </p>
                          <div className="text-xs text-gray-800 dark:text-gray-200 font-medium pl-1">
                            Maria Kitty
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-slate-500 mb-1 flex items-center gap-1">
                            <FaMapMarkerAlt className="text-gray-400 dark:text-slate-500" /> Room
                          </p>
                          <div className="text-xs text-gray-800 dark:text-gray-200 font-medium pl-1">
                            Ward B – 204
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline item 2 */}
                  <div className="relative">
                    <div className="absolute -left-[18px] top-0 w-3 h-3 rounded-full border-[3px] border-white dark:border-slate-800 bg-teal-500 shadow-sm z-10" />
                    <div className="flex items-center gap-3 mb-2 px-6">
                      <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                        19 Oct 2023
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                        02:00 PM
                      </span>
                    </div>
                    <div className="ml-6 border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:border-teal-200 dark:border-teal-700 transition-colors">
                      <h4 className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-3">
                        Follow-up & Blood Panel Review
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-slate-500 mb-1 flex items-center gap-1">
                            <FaUserCircle className="text-gray-400 dark:text-slate-500" /> Doctor
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-800 dark:text-gray-200 font-medium">
                            <img
                              src="https://i.pravatar.cc/150?u=18"
                              className="w-4 h-4 rounded-full"
                            />{" "}
                            Dr. Dianne Rachel
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-slate-500 mb-1 flex items-center gap-1">
                            <FaUserCircle className="text-gray-400 dark:text-slate-500" /> Nurse
                          </p>
                          <div className="text-xs text-gray-800 dark:text-gray-200 font-medium pl-1">
                            Markonah Nicky
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-slate-500 mb-1 flex items-center gap-1">
                            <FaMapMarkerAlt className="text-gray-400 dark:text-slate-500" /> Room
                          </p>
                          <div className="text-xs text-gray-800 dark:text-gray-200 font-medium pl-1">
                            Lab – Floor 2
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-6" />
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
              <button
                onClick={handleCloseModal}
                className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-100 dark:bg-slate-700 transition-colors flex items-center gap-2 bg-white dark:bg-slate-800 shadow-sm"
              >
                <FaTimes className="text-gray-400 dark:text-slate-500" /> Decline
              </button>
              <button
                onClick={handleCloseModal}
                className="px-5 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm shadow-teal-500/20"
              >
                <FaCheck className="text-white/80" /> Approve
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}