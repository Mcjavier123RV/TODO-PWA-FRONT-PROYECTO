import React, { useState } from "react";
import { api, setAuth, setUser } from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", { email, password });
      
      // Guardar token y usuario
      localStorage.setItem("token", data.token);
      setAuth(data.token);
      setUser(data.user);

      // Redirigir según el role
      if (data.user.role === 'admin') {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <form onSubmit={onSubmit} className="login-box">
        <h2>HosterLink</h2>
        <h3>Iniciar Sesión</h3>
        
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          required
        />
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
        />
        
        <button type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Entrar"}
        </button>
        
        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
        
        <p style={{ marginTop: "15px", fontSize: "13px", color: "#666" }}>
          ¿No tienes acceso? Contacta al administrador
        </p>
      </form>
    </div>
  );
}