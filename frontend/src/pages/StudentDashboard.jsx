import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../App.css";
import logoImg from "../image/nw_logo.jpeg";



export default function StudentDashboard() {
  const navigate = useNavigate();
  const [student, setStudent] = useState({
    first_name: "Hari",
    reg_no: "MCA2026"
  });
  

  const [quote, setQuote] = useState("");

  useEffect(() => {
    // load student from localStorage if available
    const s = localStorage.getItem("student");
    if (s) setStudent(JSON.parse(s));

    const quotes = [
      "Push yourself, because no one else is going to do it for you.",
      "Success is built on daily discipline.",
      "Code today, lead tomorrow.",
      "Small progress is still progress.",
      "Your future is created by what you practice daily."
    ];
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  return (
    <div className="dash-main">

      {/* ===== TOP BAR ===== */}
      <div className="dash-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <img src={logoImg} alt="logo" className="dash-logo" />
          <div>
            <h2 style={{ margin: 0 }}>HumanXCode AI</h2>
            <p style={{ margin: 0, opacity: 0.7 }}>Student Dashboard</p>
          </div>
        </div>

        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("student");
            navigate("/");
          }}
        >
          Logout
        </button>
      </div>

      {/* ===== GRID ===== */}
      <div className="dash-container">

        {/* USER */}
        <div className="dash-card user-box">
          <h3>👤 Student</h3>
          <h2 style={{ marginTop: 10 }}>{student.first_name}</h2>
          <p style={{ opacity: 0.8 }}>Register No: {student.reg_no}</p>
        </div>

        {/* QUOTE */}
        <div className="dash-card quote-box">
          <h3>💡 Quote for today</h3>
          <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.6 }}>
            “{quote}”
          </p>
        </div>

        {/* TAKE EXAM */}
        <div
          className="dash-card exam-box"
          onClick={() => navigate("/exam")}
        >
          <h2>📝 Take Exam</h2>
          <p style={{ marginTop: 8, opacity: 0.85 }}>
            Start your online coding exam
          </p>
        </div>

        {/* PROFILE */}
        <div className="dash-card profile-box">
          <h2>👁 View Profile</h2>
          <p style={{ marginTop: 8, opacity: 0.85 }}>
            See your personal details and history
          </p>
        </div>

        {/* CALENDAR */}
        <div className="dash-card calendar-box">
          <h2>📅 Calendar</h2>

          <div className="calendar-wrapper">
            <input
              type="date"
              style={{
                padding: "10px",
                borderRadius: 10,
                border: "1px solid #1e293b",
                background: "#0f172a",
                color: "white"
              }}
            />
          </div>

          <p style={{ marginTop: 12, opacity: 0.7 }}>
            Track exams & activities
          </p>
        </div>

      </div>
    </div>
  );
}
