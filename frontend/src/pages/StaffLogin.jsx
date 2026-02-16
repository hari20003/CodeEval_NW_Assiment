import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";

const API = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "") + "/api";


export default function StaffLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("⚠️ Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      
      const res = await axios.post(`${API}/staff/login`, {
        username,
        password
      });

      // ✅ store staff (IMPORTANT)
      localStorage.setItem("staff", JSON.stringify(res.data.staff));

      // ❌ remove student if exists
      localStorage.removeItem("student");

      // ✅ go to staff dashboard
      navigate("/staff-dashboard");

    } catch (err) {
      setError(err.response?.data?.detail || "❌ Invalid staff credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">

        <h2>HumanXCode AI</h2>
        <p className="login-sub">Staff Login</p>

        <form onSubmit={handleStaffLogin} className="login-form">

          <input
            type="text"
            placeholder="Staff username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login as Staff"}
          </button>

        </form>

      </div>
    </div>
  );
}
