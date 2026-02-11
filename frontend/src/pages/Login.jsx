import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../App.css";

// const API = process.env.REACT_APP_API_URL +"api";

export default function Login() {
  const navigate = useNavigate();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!login || !password) {
      setError("⚠️ Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
        login,
        password
      });

      // ✅ SAVE STUDENT ONLY
      localStorage.setItem("student", JSON.stringify(res.data.user));

      // ✅ GO TO STUDENT DASHBOARD
      navigate("/dashboard");

    } catch (err) {
      setError(err.response?.data?.detail || "❌ Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">

        <h2>HumanXCode AI</h2>
        <p className="login-sub">Student Login</p>

        <form onSubmit={handleLogin} className="login-form">

          <input
            type="text"
            placeholder="Username / Email / Phone"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* ===== STAFF REDIRECT ===== */}
          <p style={{ marginTop: "15px", color: "#9ca3af" }}>
            Are you a staff?
          </p>
          

          <button
            type="button"
            onClick={() => navigate("/staff-login")}   // ✅ FIXED
            style={{
              marginTop: "8px",
              background: "transparent",
              border: "1px solid #22c55e",
              color: "#22c55e",
              padding: "8px 14px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Staff Login →
          </button>

        </form>

        <p className="login-footer">
          New user? <Link to="/register">Create account</Link>
        </p>

      </div>
    </div>
  );
}
