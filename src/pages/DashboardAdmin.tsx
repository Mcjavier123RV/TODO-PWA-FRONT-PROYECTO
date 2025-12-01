import { useState, useEffect } from "react";
import { api, getUser, clearAuth } from "../api";
import { Link, useNavigate } from "react-router-dom";

export default function DashboardAdmin() {
  const user = getUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalAnuncios: 0,
    totalReservaciones: 0,
    pagosPendientes: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      // Cargar estadísticas básicas
      const [usuarios, anuncios] = await Promise.all([
        api.get("/auth/users"),
        api.get("/anuncios"),
      ]);

      setStats({
        totalUsuarios: usuarios.data.users?.length || 0,
        totalAnuncios: anuncios.data.anuncios?.length || 0,
        totalReservaciones: 0, // Puedes agregar después
        pagosPendientes: 0, // Puedes agregar después
      });
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  }

  function handleLogout() {
    clearAuth();
    navigate("/login");
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Panel de Administrador</h1>
        <div className="user-info">
          <span>👤 {user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Bienvenida */}
      <div className="welcome-section">
        <h2>Bienvenido, {user?.name}</h2>
        <p>Gestiona tu condominio desde aquí</p>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>👥 Usuarios</h3>
          <p className="stat-number">{stats.totalUsuarios}</p>
          <Link to="/admin/usuarios" className="stat-link">
            Ver todos →
          </Link>
        </div>

        <div className="stat-card">
          <h3>📢 Anuncios</h3>
          <p className="stat-number">{stats.totalAnuncios}</p>
          <Link to="/admin/anuncios" className="stat-link">
            Gestionar →
          </Link>
        </div>

        <div className="stat-card">
          <h3>📅 Reservaciones</h3>
          <p className="stat-number">{stats.totalReservaciones}</p>
          <Link to="/admin/reservaciones" className="stat-link">
            Ver todas →
          </Link>
        </div>

        <div className="stat-card">
          <h3>💰 Pagos Pendientes</h3>
          <p className="stat-number">{stats.pagosPendientes}</p>
          <Link to="/admin/pagos" className="stat-link">
            Gestionar →
          </Link>
        </div>
      </div>

      {/* Menú de navegación */}
      <div className="admin-menu">
        <h3>Gestión</h3>
        <div className="menu-grid">
          <Link to="/admin/usuarios" className="menu-item">
            <span className="menu-icon">👥</span>
            <span>Usuarios</span>
          </Link>

          <Link to="/admin/anuncios" className="menu-item">
            <span className="menu-icon">📢</span>
            <span>Anuncios</span>
          </Link>

          <Link to="/admin/reservaciones" className="menu-item">
            <span className="menu-icon">📅</span>
            <span>Reservaciones</span>
          </Link>

          <Link to="/admin/pagos" className="menu-item">
            <span className="menu-icon">💰</span>
            <span>Pagos</span>
          </Link>

          <Link to="/admin/visitantes" className="menu-item">
            <span className="menu-icon">🚗</span>
            <span>Visitantes</span>
          </Link>

          <Link to="/admin/chat" className="menu-item">
              <span className="menu-icon">💬</span>
              <span>Chat</span>
          </Link>
          

        </div>
      </div>
    </div>
  );
}