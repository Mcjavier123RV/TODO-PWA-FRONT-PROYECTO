import { useState, useEffect } from "react";
import { api, getUser, clearAuth } from "../../api";
import { useNavigate, Link } from "react-router-dom";

interface Reservacion {
  _id: string;
  usuario: {
    _id: string;
    name: string;
    email: string;
    unidad?: string;
  };
  area: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: "Pendiente" | "Confirmada" | "Cancelada";
  notas: string;
  costo: number;
  createdAt: string;
  updatedAt: string;
}

const AREAS = [
  "Salón de fiestas",
  "Alberca",
  "Gym",
  "Cancha",
  "Terraza",
  "BBQ",
  "Otro",
];

export default function Reservaciones() {
  const user = getUser();
  const navigate = useNavigate();
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReservacion, setEditingReservacion] = useState<Reservacion | null>(null);
  const [search, setSearch] = useState("");
  const [filterArea, setFilterArea] = useState<string>("all");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  
  // Formulario
  const [formData, setFormData] = useState({
    area: "Salón de fiestas",
    fecha: "",
    horaInicio: "",
    horaFin: "",
    estado: "Confirmada" as "Pendiente" | "Confirmada" | "Cancelada",
    notas: "",
    costo: 0,
  });

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    loadReservaciones();
  }, []);

  async function loadReservaciones() {
    try {
      setLoading(true);
      // Admin ve todas, usuario solo las suyas
      const endpoint = isAdmin ? "/reservaciones" : "/reservaciones/mis-reservaciones";
      const { data } = await api.get(endpoint);
      setReservaciones(data.reservaciones || []);
    } catch (error: any) {
      console.error("Error cargando reservaciones:", error);
      if (error.response?.status === 401) {
        clearAuth();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearAuth();
    navigate("/login");
  }

  function openCreateModal() {
    setEditingReservacion(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setFormData({
      area: "Salón de fiestas",
      fecha: tomorrow.toISOString().split("T")[0],
      horaInicio: "09:00",
      horaFin: "13:00",
      estado: "Confirmada",
      notas: "",
      costo: 0,
    });
    setShowModal(true);
  }

  function openEditModal(reservacion: Reservacion) {
    setEditingReservacion(reservacion);
    setFormData({
      area: reservacion.area,
      fecha: new Date(reservacion.fecha).toISOString().split("T")[0],
      horaInicio: reservacion.horaInicio,
      horaFin: reservacion.horaFin,
      estado: reservacion.estado,
      notas: reservacion.notas || "",
      costo: reservacion.costo || 0,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validar que hora fin sea mayor a hora inicio
    if (formData.horaInicio >= formData.horaFin) {
      alert("La hora de fin debe ser mayor a la hora de inicio");
      return;
    }

    try {
      if (editingReservacion) {
        // Actualizar reservación
        await api.put(`/reservaciones/${editingReservacion._id}`, formData);
        alert("Reservación actualizada exitosamente");
      } else {
        // Crear nueva reservación
        await api.post("/reservaciones", formData);
        alert("Reservación creada exitosamente");
      }
      
      setShowModal(false);
      loadReservaciones();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al guardar reservación");
    }
  }

  async function handleCancelar(reservacion: Reservacion) {
    if (!confirm(`¿Deseas cancelar la reservación de ${reservacion.area}?`)) {
      return;
    }

    try {
      await api.put(`/reservaciones/${reservacion._id}`, {
        estado: "Cancelada",
      });
      alert("Reservación cancelada exitosamente");
      loadReservaciones();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al cancelar reservación");
    }
  }

  async function handleEliminar(reservacion: Reservacion) {
    if (!isAdmin) {
      alert("Solo los administradores pueden eliminar reservaciones");
      return;
    }

    if (!confirm(`¿Deseas eliminar permanentemente esta reservación?`)) {
      return;
    }

    try {
      await api.delete(`/reservaciones/${reservacion._id}`);
      alert("Reservación eliminada exitosamente");
      loadReservaciones();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al eliminar reservación");
    }
  }

  function getEstadoIcon(estado: string) {
    switch (estado) {
      case "Confirmada": return "✅";
      case "Pendiente": return "⏳";
      case "Cancelada": return "❌";
      default: return "⚪";
    }
  }

  function getAreaIcon(area: string) {
    switch (area) {
      case "Salón de fiestas": return "🎉";
      case "Alberca": return "🏊";
      case "Gym": return "💪";
      case "Cancha": return "⚽";
      case "Terraza": return "🌅";
      case "BBQ": return "🔥";
      default: return "📍";
    }
  }

  const reservacionesFiltradas = reservaciones.filter((r) => {
    const matchSearch = 
      r.area.toLowerCase().includes(search.toLowerCase()) ||
      r.usuario?.name.toLowerCase().includes(search.toLowerCase()) ||
      r.notas?.toLowerCase().includes(search.toLowerCase());
    
    const matchArea = filterArea === "all" || r.area === filterArea;
    const matchEstado = filterEstado === "all" || r.estado === filterEstado;

    return matchSearch && matchArea && matchEstado;
  });

  // Verificar si una reservación es editable por el usuario actual
  function canEdit(reservacion: Reservacion): boolean {
    if (isAdmin) return true;
    if (reservacion.usuario._id === user?._id && reservacion.estado !== "Cancelada") {
      return true;
    }
    return false;
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>📅 Gestión de Reservaciones</h1>
        <div className="user-info">
          <span>👤 {user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Contenido */}
      <div className="page-content">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"}>Dashboard</Link>
          <span className="separator">›</span>
          <span>Reservaciones</span>
        </div>

        {/* Controles */}
        <div className="page-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="🔍 Buscar por área, usuario o notas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="filters">
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="filter-select"
            >
              <option value="all">📍 Todas las áreas</option>
              {AREAS.map((area) => (
                <option key={area} value={area}>
                  {getAreaIcon(area)} {area}
                </option>
              ))}
            </select>

            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="filter-select"
            >
              <option value="all">📊 Todos los estados</option>
              <option value="Confirmada">✅ Confirmada</option>
              <option value="Pendiente">⏳ Pendiente</option>
              <option value="Cancelada">❌ Cancelada</option>
            </select>
          </div>

          <button className="btn-create" onClick={openCreateModal}>
            ➕ Nueva Reservación
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="mini-stats">
          <div className="mini-stat">
            <span className="mini-stat-label">Total</span>
            <span className="mini-stat-value">{reservaciones.length}</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Confirmadas</span>
            <span className="mini-stat-value success">
              {reservaciones.filter((r) => r.estado === "Confirmada").length}
            </span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Pendientes</span>
            <span className="mini-stat-value warning">
              {reservaciones.filter((r) => r.estado === "Pendiente").length}
            </span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Canceladas</span>
            <span className="mini-stat-value danger">
              {reservaciones.filter((r) => r.estado === "Cancelada").length}
            </span>
          </div>
        </div>

        {/* Tabla de reservaciones */}
        {loading ? (
          <div className="loading">Cargando reservaciones...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Área</th>
                  {isAdmin && <th>Usuario</th>}
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Estado</th>
                  <th>Costo</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservacionesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="empty-table">
                      No se encontraron reservaciones
                    </td>
                  </tr>
                ) : (
                  reservacionesFiltradas.map((reservacion) => (
                    <tr key={reservacion._id}>
                      <td>
                        <div className="area-cell">
                          <span className="area-icon">{getAreaIcon(reservacion.area)}</span>
                          <strong>{reservacion.area}</strong>
                        </div>
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="user-cell">
                            <span className="user-avatar">
                              {reservacion.usuario?.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                            <div className="user-info-cell">
                              <span>{reservacion.usuario?.name || "Desconocido"}</span>
                              {reservacion.usuario?.unidad && (
                                <small>{reservacion.usuario.unidad}</small>
                              )}
                            </div>
                          </div>
                        </td>
                      )}
                      <td>
                        {new Date(reservacion.fecha).toLocaleDateString("es-MX", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <div className="horario-cell">
                          <span>🕐 {reservacion.horaInicio}</span>
                          <span>→</span>
                          <span>🕐 {reservacion.horaFin}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`estado-badge ${reservacion.estado.toLowerCase()}`}>
                          {getEstadoIcon(reservacion.estado)} {reservacion.estado}
                        </span>
                      </td>
                      <td>
                        {reservacion.costo > 0 ? (
                          <span className="costo-cell">💵 ${reservacion.costo}</span>
                        ) : (
                          <span className="costo-cell gratis">Gratis</span>
                        )}
                      </td>
                      <td>
                        <div className="notas-cell">
                          {reservacion.notas || "-"}
                        </div>
                      </td>
                      <td>
                        <div className="table-actions">
                          {canEdit(reservacion) && (
                            <button
                              className="btn-table edit"
                              onClick={() => openEditModal(reservacion)}
                              title="Editar"
                            >
                              ✏️
                            </button>
                          )}
                          {reservacion.estado !== "Cancelada" && (
                            <button
                              className="btn-table cancel"
                              onClick={() => handleCancelar(reservacion)}
                              title="Cancelar"
                            >
                              ❌
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              className="btn-table delete"
                              onClick={() => handleEliminar(reservacion)}
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de crear/editar */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingReservacion ? "✏️ Editar Reservación" : "➕ Nueva Reservación"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Área *</label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    required
                    disabled={!isAdmin && !!editingReservacion}
                  >
                    {AREAS.map((area) => (
                      <option key={area} value={area}>
                        {getAreaIcon(area)} {area}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Fecha *</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                    disabled={!isAdmin && !!editingReservacion}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Hora inicio *</label>
                  <input
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                    required
                    disabled={!isAdmin && !!editingReservacion}
                  />
                </div>

                <div className="form-group">
                  <label>Hora fin *</label>
                  <input
                    type="time"
                    value={formData.horaFin}
                    onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                    required
                    disabled={!isAdmin && !!editingReservacion}
                  />
                </div>

                {isAdmin && (
                  <>
                    <div className="form-group">
                      <label>Estado *</label>
                      <select
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                        required
                      >
                        <option value="Confirmada">✅ Confirmada</option>
                        <option value="Pendiente">⏳ Pendiente</option>
                        <option value="Cancelada">❌ Cancelada</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Costo ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.costo}
                        onChange={(e) => setFormData({ ...formData, costo: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </>
                )}

                <div className="form-group full-width">
                  <label>Notas (opcional)</label>
                  <textarea
                    rows={3}
                    placeholder="Información adicional sobre la reservación..."
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    style={{ resize: "vertical", minHeight: "60px" }}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editingReservacion ? "Guardar Cambios" : "Crear Reservación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}