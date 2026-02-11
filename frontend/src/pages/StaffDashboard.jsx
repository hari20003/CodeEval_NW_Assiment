import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../App.css";

// ✅ Make sure this file really exists: src/image/nw_logo.jpeg
import logo from "../image/nw_logo.jpeg";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [staff, setStaff] = useState(null);

  /* ================= AUTH PROTECT ================= */
  useEffect(() => {
    const stored = localStorage.getItem("staff");

    if (!stored) {
      navigate("/staff-login");   // ✅ FIXED
    } else {
      try {
        setStaff(JSON.parse(stored));
      } catch {
        localStorage.removeItem("staff");
        navigate("/staff-login"); // ✅ FIXED
      }
    }
  }, [navigate]);

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    localStorage.removeItem("staff");
    navigate("/staff-login"); // ✅ FIXED
  };

  /* ================= UI ================= */
  return (
    <div className="dash-main">

      {/* ===== TOP BAR ===== */}
      <div className="dash-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={logo} alt="logo" className="dash-logo" />
          <h2 style={{ fontWeight: 700, color: "#00ff9d" }}>
            HumanXCode – Staff
          </h2>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* ===== DASHBOARD GRID ===== */}
      <div className="dash-container">

        {/* STAFF INFO */}
        <div className="dash-card user-box">
          <h2>👨‍🏫 Staff Panel</h2>
          <p style={{ marginTop: 8 }}>
            HumanXCode AI Examination System
          </p>

          <p style={{ marginTop: 6 }}>
            <b>Username:</b> {staff?.username || "—"}
          </p>

          <p>
            <b>Email:</b> {staff?.email || "—"}
          </p>

          <p style={{ marginTop: 8, color: "#00ff9d" }}>
            You have full exam control access
          </p>
        </div>

        {/* QUOTE */}
        <div className="dash-card quote-box">
          <h3>💡 Quote of the Day</h3>
          <p style={{ marginTop: 10, lineHeight: 1.6 }}>
            “A good teacher can inspire hope, ignite imagination, and instill a love of learning.”
          </p>
        </div>

        {/* ✅ REPORTS */}
        <div
          className="dash-card exam-box"
          role="button"
          onClick={() => navigate("/staff-reports")}   // ✅ FIXED
        >
          <h2>📊 Student Reports</h2>
          <p>View exam submissions, marks and performance</p>
        </div>

        {/* QUESTIONS */}
        <div
          className="dash-card profile-box clickable"
          role="button"
          
          onClick={() => navigate("/staff-questions")}

        >
          <h2>📝 Question Management</h2>
          <p style={{ marginTop: 6 }}>
            Create, update and manage exam questions
          </p>
        </div>

        {/* CALENDAR */}
        <div className="dash-card calendar-box">
          <h2>📅 Academic Calendar</h2>
          <div className="calendar-wrapper">
            <Calendar onChange={setDate} value={date} />
          </div>
        </div>

      </div>
    </div>
  );
}
