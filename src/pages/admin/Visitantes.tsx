import { useState, useEffect } from "react";
import { api, getUser, clearAuth } from "../../api";
import { useNavigate, Link } from "react-router-dom";

interface Visitante {
  _id: string;
  solicitadoPor: {
    _id: string;
    name: string;
    email: string;
    unidad?: string;
  };
  nombreVisitante: string;
  fechaVisita: string;
  horaLlegada: string;
  vehiculo?: {
    placas?: string;
    marca?: string;
    color?: string;
  };
  estado: "Pendiente" | "Aprobada" | "Rechazada" | "Finalizada";
  notas: string;
  horaEntrada?: string;
  horaSalida?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Visitantes() {
  const user = getUser();
  const navigate = useNavigate();
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVisitante, setEditingVisitante] = useState<Visitante | null>(null);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  
  // Formulario
  const [formData, setFormData] = useState({
    nombreVisitante: "",
    fechaVisita: "",
    horaLlegada: "",
    vehiculoPlacas: "",
    vehiculoMarca: "",
    vehiculoColor: "",
    estado: "Pendiente" as "Pendiente" | "Aprobada" | "Rechazada" | "Finalizada",
    notas: "",
  });

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    loadVisitantes();
  }, []);

  async function loadVisitantes() {
    try {
      setLoading(true);
      const endpoint = isAdmin ? "/visitantes" : "/visitantes/mis-visitas";
      const { data } = await api.get(endpoint);
      setVisitantes(data.visitantes || []);
    } catch (error: any) {
      console.error("Error cargando visitantes:", error);
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
    setEditingVisitante(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setFormData({
      nombreVisitante: "",
      fechaVisita: tomorrow.toISOString().split("T")[0],
      horaLlegada: "10:00",
      vehiculoPlacas: "",
      vehiculoMarca: "",
      vehiculoColor: "",
      estado: "Pendiente",
      notas: "",
    });
    setShowModal(true);
  }

  function openEditModal(visitante: Visitante) {
    // Usuario solo puede editar pendientes, admin puede editar todo
    if (!isAdmin && visitante.estado !== "Pendiente") {
      alert("Solo puedes editar solicitudes pendientes");
      return;
    }

    setEditingVisitante(visitante);
    setFormData({
      nombreVisitante: visitante.nombreVisitante,
      fechaVisita: new Date(visitante.fechaVisita).toISOString().split("T")[0],
      horaLlegada: visitante.horaLlegada,
      vehiculoPlacas: visitante.vehiculo?.placas || "",
      vehiculoMarca: visitante.vehiculo?.marca || "",
      vehiculoColor: visitante.vehiculo?.color || "",
      estado: visitante.estado,
      notas: visitante.notas || "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      nombreVisitante: formData.nombreVisitante,
      fechaVisita: formData.fechaVisita,
      horaLlegada: formData.horaLlegada,
      vehiculo: {
        placas: formData.vehiculoPlacas,
        marca: formData.vehiculoMarca,
        color: formData.vehiculoColor,
      },
      estado: isAdmin ? formData.estado : "Pendiente",
      notas: formData.notas,
    };

    try {
      if (editingVisitante) {
        await api.put(`/visitantes/${editingVisitante._id}`, payload);
        alert("Visitante actualizado exitosamente");
      } else {
        await api.post("/visitantes", payload);
        alert("Visitante registrado exitosamente");
      }
      
      setShowModal(false);
      loadVisitantes();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al guardar visitante");
    }
  }

  async function handleRegistrarEntrada(visitante: Visitante) {
    if (!isAdmin) return;

    if (!confirm(`¿Registrar entrada de ${visitante.nombreVisitante}?`)) {
      return;
    }

    try {
      await api.patch(`/visitantes/${visitante._id}/entrada`);
      alert("Entrada registrada exitosamente");
      loadVisitantes();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al registrar entrada");
    }
  }

  async function handleRegistrarSalida(visitante: Visitante) {
    if (!isAdmin) return;

    if (!confirm(`¿Registrar salida de ${visitante.nombreVisitante}?`)) {
      return;
    }

    try {
      await api.patch(`/visitantes/${visitante._id}/salida`);
      alert("Salida registrada exitosamente");
      loadVisitantes();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al registrar salida");
    }
  }

  async function handleEliminar(visitante: Visitante) {
    // Usuario puede cancelar sus propias solicitudes, admin puede eliminar cualquiera
    const mensaje = isAdmin 
      ? "¿Deseas eliminar esta solicitud de visitante?" 
      : "¿Deseas cancelar tu solicitud de visitante?";

    if (!confirm(mensaje)) return;

    try {
      await api.delete(`/visitantes/${visitante._id}`);
      alert("Visitante eliminado exitosamente");
      loadVisitantes();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al eliminar visitante");
    }
  }

  function getEstadoIcon(estado: string) {
    switch (estado) {
      case "Pendiente": return "⏳";
      case "Aprobada": return "✅";
      case "Rechazada": return "❌";
      case "Finalizada": return "🏁";
      default: return "⚪";
    }
  }

  function getEstadoClass(estado: string): string {
    return estado.toLowerCase();
  }

  const visitantesFiltrados = visitantes.filter((v) => {
    const matchSearch = 
      v.nombreVisitante.toLowerCase().includes(search.toLowerCase()) ||
      v.solicitadoPor?.name.toLowerCase().includes(search.toLowerCase()) ||
      v.vehiculo?.placas?.toLowerCase().includes(search.toLowerCase()) ||
      v.solicitadoPor?.unidad?.toLowerCase().includes(search.toLowerCase());
    
    const matchEstado = filterEstado === "all" || v.estado === filterEstado;

    return matchSearch && matchEstado;
  });

  // Verificar si puede editar
  function canEdit(visitante: Visitante): boolean {
    if (isAdmin) return true;
    return visitante.solicitadoPor._id === user?._id && visitante.estado === "Pendiente";
  }

  // Verificar si puede cancelar
  function canDelete(visitante: Visitante): boolean {
    if (isAdmin) return true;
    return visitante.solicitadoPor._id === user?._id;
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>🚗 Gestión de Visitantes</h1>
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
          <span>Visitantes</span>
        </div>

        {/* Controles */}
        <div className="page-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, usuario, unidad o placas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="filters">
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="filter-select"
            >
              <option value="all">📊 Todos los estados</option>
              <option value="Pendiente">⏳ Pendiente</option>
              <option value="Aprobada">✅ Aprobada</option>
              <option value="Rechazada">❌ Rechazada</option>
              <option value="Finalizada">🏁 Finalizada</option>
            </select>
          </div>

          <button className="btn-create" onClick={openCreateModal}>
            ➕ Registrar Visitante
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="mini-stats">
          <div className="mini-stat">
            <span className="mini-stat-label">Total</span>
            <span className="mini-stat-value">{visitantes.length}</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Pendientes</span>
            <span className="mini-stat-value warning">
              {visitantes.filter((v) => v.estado === "Pendiente").length}
            </span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Aprobadas</span>
            <span className="mini-stat-value success">
              {visitantes.filter((v) => v.estado === "Aprobada").length}
            </span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Finalizadas</span>
            <span className="mini-stat-value">
              {visitantes.filter((v) => v.estado === "Finalizada").length}
            </span>
          </div>
        </div>

        {/* Tabla de visitantes */}
        {loading ? (
          <div className="loading">Cargando visitantes...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Visitante</th>
                  {isAdmin && <th>Solicitado por</th>}
                  <th>Fecha Visita</th>
                  <th>Hora Esperada</th>
                  <th>Vehículo</th>
                  <th>Estado</th>
                  {isAdmin && <th>Entrada/Salida</th>}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visitantesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 6} className="empty-table">
                      No se encontraron visitantes
                    </td>
                  </tr>
                ) : (
                  visitantesFiltrados.map((visitante) => (
                    <tr key={visitante._id}>
                      <td>
                        <div className="visitante-cell">
                          <span className="visitante-avatar">👤</span>
                          <strong>{visitante.nombreVisitante}</strong>
                        </div>
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="user-cell">
                            <span className="user-avatar">
                              {visitante.solicitadoPor?.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                            <div className="user-info-cell">
                              <span>{visitante.solicitadoPor?.name || "Desconocido"}</span>
                              {visitante.solicitadoPor?.unidad && (
                                <small>{visitante.solicitadoPor.unidad}</small>
                              )}
                            </div>
                          </div>
                        </td>
                      )}
                      <td>
                        {new Date(visitante.fechaVisita).toLocaleDateString("es-MX", {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <span className="hora-cell">🕐 {visitante.horaLlegada}</span>
                      </td>
                      <td>
                        {visitante.vehiculo?.placas ? (
                          <div className="vehiculo-cell">
                            <div className="vehiculo-placas">🚗 {visitante.vehiculo.placas}</div>
                            {(visitante.vehiculo.marca || visitante.vehiculo.color) && (
                              <small>
                                {visitante.vehiculo.marca} {visitante.vehiculo.color}
                              </small>
                            )}
                          </div>
                        ) : (
                          <span className="no-vehiculo">Sin vehículo</span>
                        )}
                      </td>
                      <td>
                        <span className={`estado-badge ${getEstadoClass(visitante.estado)}`}>
                          {getEstadoIcon(visitante.estado)} {visitante.estado}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="entrada-salida-cell">
                            {visitante.horaEntrada && (
                              <div className="entrada-info">
                                ↓ {new Date(visitante.horaEntrada).toLocaleTimeString("es-MX", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </div>
                            )}
                            {visitante.horaSalida && (
                              <div className="salida-info">
                                ↑ {new Date(visitante.horaSalida).toLocaleTimeString("es-MX", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </div>
                            )}
                            {!visitante.horaEntrada && !visitante.horaSalida && "-"}
                          </div>
                        </td>
                      )}
                      <td>
                        <div className="table-actions">
                          {isAdmin && visitante.estado === "Pendiente" && (
                            <button
                              className="btn-table approve"
                              onClick={() => handleRegistrarEntrada(visitante)}
                              title="Aprobar y registrar entrada"
                            >
                              ✅
                            </button>
                          )}
                          {isAdmin && visitante.estado === "Aprobada" && !visitante.horaSalida && (
                            <button
                              className="btn-table exit"
                              onClick={() => handleRegistrarSalida(visitante)}
                              title="Registrar salida"
                            >
                              🚪
                            </button>
                          )}
                          {canEdit(visitante) && (
                            <button
                              className="btn-table edit"
                              onClick={() => openEditModal(visitante)}
                              title="Editar"
                            >
                              ✏️
                            </button>
                          )}
                          {canDelete(visitante) && (
                            <button
                              className="btn-table delete"
                              onClick={() => handleEliminar(visitante)}
                              title={isAdmin ? "Eliminar" : "Cancelar"}
                            >
                              {isAdmin ? "🗑️" : "❌"}
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
              <h2>{editingVisitante ? "✏️ Editar Visitante" : "➕ Registrar Visitante"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre del Visitante *</label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    value={formData.nombreVisitante}
                    onChange={(e) => setFormData({ ...formData, nombreVisitante: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fecha de Visita *</label>
                  <input
                    type="date"
                    value={formData.fechaVisita}
                    onChange={(e) => setFormData({ ...formData, fechaVisita: e.target.value })}
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="form-group">
                  <label>Hora de Llegada *</label>
                  <input
                    type="time"
                    value={formData.horaLlegada}
                    onChange={(e) => setFormData({ ...formData, horaLlegada: e.target.value })}
                    required
                  />
                </div>

                {isAdmin && (
                  <div className="form-group">
                    <label>Estado *</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                      required
                    >
                      <option value="Pendiente">⏳ Pendiente</option>
                      <option value="Aprobada">✅ Aprobada</option>
                      <option value="Rechazada">❌ Rechazada</option>
                      <option value="Finalizada">🏁 Finalizada</option>
                    </select>
                  </div>
                )}

                <div className="form-section full-width">
                  <h4>🚗 Información del Vehículo (Opcional)</h4>
                </div>

                <div className="form-group">
                  <label>Placas</label>
                  <input
                    type="text"
                    placeholder="Ej: ABC-123"
                    value={formData.vehiculoPlacas}
                    onChange={(e) => setFormData({ ...formData, vehiculoPlacas: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="form-group">
                  <label>Marca</label>
                  <input
                    type="text"
                    placeholder="Ej: Toyota"
                    value={formData.vehiculoMarca}
                    onChange={(e) => setFormData({ ...formData, vehiculoMarca: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="text"
                    placeholder="Ej: Blanco"
                    value={formData.vehiculoColor}
                    onChange={(e) => setFormData({ ...formData, vehiculoColor: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Notas (opcional)</label>
                  <textarea
                    rows={2}
                    placeholder="Información adicional sobre la visita..."
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    style={{ resize: "vertical", minHeight: "50px" }}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editingVisitante ? "Guardar Cambios" : "Registrar Visitante"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}