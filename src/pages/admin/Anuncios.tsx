import { useState, useEffect } from "react";
import { api, getUser, clearAuth } from "../../api";
import { useNavigate, Link } from "react-router-dom";

interface Anuncio {
  _id: string;
  titulo: string;
  descripcion: string;
  tipo: "Anuncio" | "Reporte";
  prioridad: "Baja" | "Media" | "Alta";
  creadoPor: {
    _id: string;
    name: string;
    email: string;
  };
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Anuncios() {
  const user = getUser();
  const navigate = useNavigate();
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnuncio, setEditingAnuncio] = useState<Anuncio | null>(null);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterPrioridad, setFilterPrioridad] = useState<string>("all");
  
  // Formulario
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    tipo: "Anuncio" as "Anuncio" | "Reporte",
    prioridad: "Media" as "Baja" | "Media" | "Alta",
  });

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    loadAnuncios();
  }, []);

  async function loadAnuncios() {
    try {
      setLoading(true);
      const { data } = await api.get("/anuncios");
      setAnuncios(data.anuncios || []);
    } catch (error: any) {
      console.error("Error cargando anuncios:", error);
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
    if (!isAdmin) {
      alert("Solo los administradores pueden crear anuncios");
      return;
    }
    setEditingAnuncio(null);
    setFormData({
      titulo: "",
      descripcion: "",
      tipo: "Anuncio",
      prioridad: "Media",
    });
    setShowModal(true);
  }

  function openEditModal(anuncio: Anuncio) {
    if (!isAdmin) {
      alert("Solo los administradores pueden editar anuncios");
      return;
    }
    setEditingAnuncio(anuncio);
    setFormData({
      titulo: anuncio.titulo,
      descripcion: anuncio.descripcion,
      tipo: anuncio.tipo,
      prioridad: anuncio.prioridad,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isAdmin) {
      alert("Solo los administradores pueden realizar esta acción");
      return;
    }

    try {
      if (editingAnuncio) {
        // Actualizar anuncio
        await api.put(`/anuncios/${editingAnuncio._id}`, formData);
        alert("Anuncio actualizado exitosamente");
      } else {
        // Crear nuevo anuncio
        await api.post("/anuncios", formData);
        alert("Anuncio creado exitosamente");
      }
      
      setShowModal(false);
      loadAnuncios();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al guardar anuncio");
    }
  }

  async function handleToggleActivo(anuncio: Anuncio) {
    if (!isAdmin) {
      alert("Solo los administradores pueden realizar esta acción");
      return;
    }

    if (!confirm(`¿Deseas ${anuncio.activo ? "desactivar" : "activar"} este anuncio?`)) {
      return;
    }

    try {
      await api.delete(`/anuncios/${anuncio._id}`);
      alert("Anuncio desactivado exitosamente");
      loadAnuncios();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al cambiar estado");
    }
  }

  function getPrioridadIcon(prioridad: string) {
    switch (prioridad) {
      case "Alta": return "🔴";
      case "Media": return "🟡";
      case "Baja": return "🟢";
      default: return "⚪";
    }
  }

  function getTipoIcon(tipo: string) {
    return tipo === "Anuncio" ? "📢" : "⚠️";
  }

  const anunciosFiltrados = anuncios.filter((a) => {
    const matchSearch = 
      a.titulo.toLowerCase().includes(search.toLowerCase()) ||
      a.descripcion.toLowerCase().includes(search.toLowerCase()) ||
      a.creadoPor?.name.toLowerCase().includes(search.toLowerCase());
    
    const matchTipo = filterTipo === "all" || a.tipo === filterTipo;
    const matchPrioridad = filterPrioridad === "all" || a.prioridad === filterPrioridad;

    return matchSearch && matchTipo && matchPrioridad;
  });

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>📢 Gestión de Anuncios</h1>
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
          <Link to="/admin/dashboard">Dashboard</Link>
          <span className="separator">›</span>
          <span>Anuncios</span>
        </div>

        {/* Controles */}
        <div className="page-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="🔍 Buscar por título, descripción o autor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="filters">
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="filter-select"
            >
              <option value="all">📋 Todos los tipos</option>
              <option value="Anuncio">📢 Anuncios</option>
              <option value="Reporte">⚠️ Reportes</option>
            </select>

            <select
              value={filterPrioridad}
              onChange={(e) => setFilterPrioridad(e.target.value)}
              className="filter-select"
            >
              <option value="all">⚡ Todas las prioridades</option>
              <option value="Alta">🔴 Alta</option>
              <option value="Media">🟡 Media</option>
              <option value="Baja">🟢 Baja</option>
            </select>
          </div>

          {isAdmin && (
            <button className="btn-create" onClick={openCreateModal}>
              ➕ Nuevo Anuncio
            </button>
          )}
        </div>

        {/* Estadísticas rápidas */}
        <div className="mini-stats">
          <div className="mini-stat">
            <span className="mini-stat-label">Total</span>
            <span className="mini-stat-value">{anuncios.length}</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Anuncios</span>
            <span className="mini-stat-value success">
              {anuncios.filter((a) => a.tipo === "Anuncio").length}
            </span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Reportes</span>
            <span className="mini-stat-value warning">
              {anuncios.filter((a) => a.tipo === "Reporte").length}
            </span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Alta Prioridad</span>
            <span className="mini-stat-value danger">
              {anuncios.filter((a) => a.prioridad === "Alta").length}
            </span>
          </div>
        </div>

        {/* Tabla de anuncios */}
        {loading ? (
          <div className="loading">Cargando anuncios...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Título</th>
                  <th>Descripción</th>
                  <th>Prioridad</th>
                  <th>Creado por</th>
                  <th>Fecha</th>
                  {isAdmin && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {anunciosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="empty-table">
                      No se encontraron anuncios
                    </td>
                  </tr>
                ) : (
                  anunciosFiltrados.map((anuncio) => (
                    <tr key={anuncio._id}>
                      <td>
                        <span className={`role-badge ${anuncio.tipo.toLowerCase()}`}>
                          {getTipoIcon(anuncio.tipo)} {anuncio.tipo}
                        </span>
                      </td>
                      <td>
                        <strong>{anuncio.titulo}</strong>
                      </td>
                      <td>
                        <div className="descripcion-cell">
                          {anuncio.descripcion.length > 60
                            ? `${anuncio.descripcion.substring(0, 60)}...`
                            : anuncio.descripcion}
                        </div>
                      </td>
                      <td>
                        <span className={`prioridad-badge ${anuncio.prioridad.toLowerCase()}`}>
                          {getPrioridadIcon(anuncio.prioridad)} {anuncio.prioridad}
                        </span>
                      </td>
                      <td>
                        <div className="user-cell">
                          <span className="user-avatar">
                            {anuncio.creadoPor?.name?.charAt(0).toUpperCase() || "?"}
                          </span>
                          <span>{anuncio.creadoPor?.name || "Desconocido"}</span>
                        </div>
                      </td>
                      <td>
                        {new Date(anuncio.createdAt).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="table-actions">
                            <button
                              className="btn-table edit"
                              onClick={() => openEditModal(anuncio)}
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-table toggle"
                              onClick={() => handleToggleActivo(anuncio)}
                              title="Desactivar"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
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
              <h2>{editingAnuncio ? "✏️ Editar Anuncio" : "➕ Nuevo Anuncio"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Título *</label>
                  <input
                    type="text"
                    placeholder="Ej: Mantenimiento programado"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Descripción *</label>
                  <textarea
                    rows={4}
                    placeholder="Describe el anuncio o reporte..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    required
                    style={{ resize: "vertical", minHeight: "80px" }}
                  />
                </div>

                <div className="form-group">
                  <label>Tipo *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as "Anuncio" | "Reporte" })}
                    required
                  >
                    <option value="Anuncio">📢 Anuncio</option>
                    <option value="Reporte">⚠️ Reporte</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Prioridad *</label>
                  <select
                    value={formData.prioridad}
                    onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as "Baja" | "Media" | "Alta" })}
                    required
                  >
                    <option value="Baja">🟢 Baja</option>
                    <option value="Media">🟡 Media</option>
                    <option value="Alta">🔴 Alta</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editingAnuncio ? "Guardar Cambios" : "Crear Anuncio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}