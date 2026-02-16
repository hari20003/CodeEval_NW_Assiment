import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../App.css";

const API = process.env.REACT_APP_API_URL +"/api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    first_name: "",
    last_name: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      await axios.post(`${API}/auth/register`, form);

      alert("✅ Registration successful. Please login.");
      navigate("/");

    } catch (err) {
      setError(err.response?.data?.detail || "❌ Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">

        <h2>Create Account</h2>

        <form onSubmit={handleRegister} className="login-form">

          <input name="first_name" placeholder="First Name" onChange={change} />
          <input name="last_name" placeholder="Last Name" onChange={change} />
          <input name="username" placeholder="Username" onChange={change} />
          <input name="email" placeholder="Email" onChange={change} />
          <input name="phone" placeholder="Phone" onChange={change} />
          <input type="password" name="password" placeholder="Password" onChange={change} />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Register"}
          </button>

        </form>

        <p className="login-footer">
          Already have account? <Link to="/">Login</Link>
        </p>

      </div>
    </div>
  );
}
