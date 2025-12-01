import { useState, useEffect } from "react";
import { api, getUser, clearAuth } from "../../api";
import { useNavigate, Link } from "react-router-dom";

interface Usuario {
  _id: string;
  name: string;
  email: string;
  role: string;
  unidad: string;
  telefono: string;
  activo: boolean;
  createdAt: string;
}

export default function Usuarios() {
  const user = getUser();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [search, setSearch] = useState("");
  
  // Formulario
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "usuario",
    unidad: "",
    telefono: "",
  });

  useEffect(() => {
    loadUsuarios();
  }, []);

  async function loadUsuarios() {
    try {
      setLoading(true);
      const { data } = await api.get("/auth/users");
      setUsuarios(data.users || []);
    } catch (error: any) {
      console.error("Error cargando usuarios:", error);
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
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "usuario",
      unidad: "",
      telefono: "",
    });
    setShowModal(true);
  }

  function openEditModal(usuario: Usuario) {
    setEditingUser(usuario);
    setFormData({
      name: usuario.name,
      email: usuario.email,
      password: "",
      role: usuario.role,
      unidad: usuario.unidad || "",
      telefono: usuario.telefono || "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingUser) {
        // Actualizar usuario
        await api.put(`/auth/users/${editingUser._id}`, formData);
        alert("Usuario actualizado exitosamente");
      } else {
        // Crear nuevo usuario
        await api.post("/auth/register", formData);
        alert("Usuario creado exitosamente");
      }
      
      setShowModal(false);
      loadUsuarios();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al guardar usuario");
    }
  }

  async function handleToggleActivo(usuario: Usuario) {
    if (!confirm(`¿Deseas ${usuario.activo ? "desactivar" : "activar"} a ${usuario.name}?`)) {
      return;
    }

    try {
      await api.put(`/auth/users/${usuario._id}`, {
        ...usuario,
        activo: !usuario.activo,
      });
      alert(`Usuario ${usuario.activo ? "desactivado" : "activado"} exitosamente`);
      loadUsuarios();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al cambiar estado");
    }
  }

  const usuariosFiltrados = usuarios.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.unidad?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>👥 Gestión de Usuarios</h1>
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
          <span>Usuarios</span>
        </div>

        {/* Controles */}
        <div className="page-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, email o unidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-create" onClick={openCreateModal}>
            ➕ Nuevo Usuario
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="mini-stats">
          <div className="mini-stat">
            <span className="mini-stat-label">Total</span>
            <span className="mini-stat-value">{usuarios.length}</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Activos</span>
            <span className="mini-stat-value success">
              {usuarios.filter((u) => u.activo).length}
            </span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Inactivos</span>
            <span className="mini-stat-value danger">
              {usuarios.filter((u) => !u.activo).length}
            </span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Admins</span>
            <span className="mini-stat-value warning">
              {usuarios.filter((u) => u.role === "admin").length}
            </span>
          </div>
        </div>

        {/* Tabla de usuarios */}
        {loading ? (
          <div className="loading">Cargando usuarios...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Unidad</th>
                  <th>Teléfono</th>
                  <th>Role</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-table">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((usuario) => (
                    <tr key={usuario._id}>
                      <td>
                        <div className="user-cell">
                          <span className="user-avatar">
                            {usuario.name.charAt(0).toUpperCase()}
                          </span>
                          <span>{usuario.name}</span>
                        </div>
                      </td>
                      <td>{usuario.email}</td>
                      <td>{usuario.unidad || "-"}</td>
                      <td>{usuario.telefono || "-"}</td>
                      <td>
                        <span className={`role-badge ${usuario.role}`}>
                          {usuario.role === "admin" ? "👑 Admin" : "👤 Usuario"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${usuario.activo ? "active" : "inactive"}`}>
                          {usuario.activo ? "✓ Activo" : "✗ Inactivo"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-table edit"
                            onClick={() => openEditModal(usuario)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-table toggle"
                            onClick={() => handleToggleActivo(usuario)}
                            title={usuario.activo ? "Desactivar" : "Activar"}
                          >
                            {usuario.activo ? "🔴" : "🟢"}
                          </button>
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
              <h2>{editingUser ? "✏️ Editar Usuario" : "➕ Nuevo Usuario"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre completo *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contraseña {editingUser && "(dejar vacío para no cambiar)"}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                  />
                </div>

                <div className="form-group">
                  <label>Unidad/Departamento</label>
                  <input
                    type="text"
                    placeholder="Ej: A-101"
                    value={formData.unidad}
                    onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    placeholder="Ej: 3312345678"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Rol *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  >
                    <option value="usuario">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editingUser ? "Guardar Cambios" : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}