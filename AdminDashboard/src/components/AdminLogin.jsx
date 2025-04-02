import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./styles/Auth.css";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      localStorage.setItem("adminToken", response.data.token);
      localStorage.setItem("adminEmail", response.data.email); // ✅ Save admin email for role-based filtering
      alert("✅ Login successful!");
      window.location.href = "/";
    } catch (error) {
      alert("❌ Login failed: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="auth-container">
      <h2>🔐 Admin Login</h2>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
      <p>Don't have an account? <a href="/admin/signup">Sign Up Here</a></p>
      {/* ✅ Forgot Password Link */}
      <p>
        <a href="/admin/forgot-password" className="forgot-password">Forgot Password?</a>
      </p>
    </div>
  );
};

export default AdminLogin;
