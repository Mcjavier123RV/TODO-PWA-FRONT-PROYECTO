import { useState, useEffect } from "react";
import { api, getUser, clearAuth } from "../../api";
import { useNavigate, Link } from "react-router-dom";

interface Pago {
  _id: string;
  usuario: {
    _id: string;
    name: string;
    email: string;
    unidad?: string;
  };
  concepto: "Mantenimiento" | "Renta" | "Reservación" | "Multa" | "Otro";
  monto: number;
  mes: string;
  fechaVencimiento: string;
  fechaPago?: string;
  estado: "Pendiente" | "Pagado" | "Vencido";
  metodoPago?: string;
  notas: string;
  registradoPor?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Usuario {
  _id: string;
  name: string;
  email: string;
  unidad?: string;
}

const CONCEPTOS = ["Mantenimiento", "Renta", "Reservación", "Multa", "Otro"];
const METODOS_PAGO = ["Efectivo", "Transferencia", "Tarjeta", "Cheque", "Otro"];

export default function Pagos() {
  const user = getUser();
  const navigate = useNavigate();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [editingPago, setEditingPago] = useState<Pago | null>(null);
  const [pagoToMark, setPagoToMark] = useState<Pago | null>(null);
  const [search, setSearch] = useState("");
  const [filterConcepto, setFilterConcepto] = useState<string>("all");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  
  // Formulario crear/editar
  const [formData, setFormData] = useState({
    usuario: "",
    concepto: "Mantenimiento" as typeof CONCEPTOS[number],
    monto: 0,
    mes: "",
    fechaVencimiento: "",
    estado: "Pendiente" as "Pendiente" | "Pagado" | "Vencido",
    metodoPago: "",
    notas: "",
  });

  // Formulario marcar como pagado
  const [pagoData, setPagoData] = useState({
    metodoPago: "Transferencia",
    fechaPago: new Date().toISOString().split("T")[0],
  });

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    loadPagos();
    if (isAdmin) {
      loadUsuarios();
    }
  }, []);

  async function loadPagos() {
    try {
      setLoading(true);
      const endpoint = isAdmin ? "/pagos" : "/pagos/mis-pagos";
      const { data } = await api.get(endpoint);
      setPagos(data.pagos || []);
    } catch (error: any) {
      console.error("Error cargando pagos:", error);
      if (error.response?.status === 401) {
        clearAuth();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadUsuarios() {
    try {
      const { data } = await api.get("/auth/users");
      setUsuarios(data.users || []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  }

  function handleLogout() {
    clearAuth();
    navigate("/login");
  }

  function openCreateModal() {
    if (!isAdmin) {
      alert("Solo los administradores pueden crear pagos");
      return;
    }
    setEditingPago(null);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(5); // Vencimiento el día 5 del próximo mes

    const mesNombre = nextMonth.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
    
    setFormData({
      usuario: usuarios.length > 0 ? usuarios[0]._id : "",
      concepto: "Mantenimiento",
      monto: 0,
      mes: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1),
      fechaVencimiento: nextMonth.toISOString().split("T")[0],
      estado: "Pendiente",
      metodoPago: "",
      notas: "",
    });
    setShowModal(true);
  }

  function openEditModal(pago: Pago) {
    if (!isAdmin) {
      alert("Solo los administradores pueden editar pagos");
      return;
    }
    setEditingPago(pago);
    setFormData({
      usuario: pago.usuario._id,
      concepto: pago.concepto,
      monto: pago.monto,
      mes: pago.mes || "",
      fechaVencimiento: new Date(pago.fechaVencimiento).toISOString().split("T")[0],
      estado: pago.estado,
      metodoPago: pago.metodoPago || "",
      notas: pago.notas || "",
    });
    setShowModal(true);
  }

  function openPagoModal(pago: Pago) {
    if (!isAdmin) {
      alert("Solo los administradores pueden marcar pagos");
      return;
    }
    setPagoToMark(pago);
    setPagoData({
      metodoPago: "Transferencia",
      fechaPago: new Date().toISOString().split("T")[0],
    });
    setShowPagoModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isAdmin) {
      alert("Solo los administradores pueden realizar esta acción");
      return;
    }

    try {
      if (editingPago) {
        await api.put(`/pagos/${editingPago._id}`, formData);
        alert("Pago actualizado exitosamente");
      } else {
        await api.post("/pagos", formData);
        alert("Pago creado exitosamente");
      }
      
      setShowModal(false);
      loadPagos();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al guardar pago");
    }
  }

  async function handleMarcarPagado(e: React.FormEvent) {
    e.preventDefault();

    if (!pagoToMark) return;

    try {
      await api.patch(`/pagos/${pagoToMark._id}/pagar`, pagoData);
      alert("Pago registrado como pagado exitosamente");
      setShowPagoModal(false);
      setPagoToMark(null);
      loadPagos();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al marcar como pagado");
    }
  }

  async function handleEliminar(pago: Pago) {
    if (!isAdmin) {
      alert("Solo los administradores pueden eliminar pagos");
      return;
    }

    if (!confirm(`¿Deseas eliminar permanentemente este pago de ${pago.concepto}?`)) {
      return;
    }

    try {
      await api.delete(`/pagos/${pago._id}`);
      alert("Pago eliminado exitosamente");
      loadPagos();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error al eliminar pago");
    }
  }

  function getEstadoIcon(estado: string) {
    switch (estado) {
      case "Pagado": return "✅";
      case "Pendiente": return "⏳";
      case "Vencido": return "⚠️";
      default: return "⚪";
    }
  }

  function getConceptoIcon(concepto: string) {
    switch (concepto) {
      case "Mantenimiento": return "🔧";
      case "Renta": return "🏠";
      case "Reservación": return "📅";
      case "Multa": return "⚠️";
      case "Otro": return "💵";
      default: return "💰";
    }
  }

  function isVencido(pago: Pago): boolean {
    if (pago.estado === "Pagado") return false;
    const hoy = new Date();
    const vencimiento = new Date(pago.fechaVencimiento);
    return vencimiento < hoy;
  }

  const pagosFiltrados = pagos.filter((p) => {
    // Convertir todo a string seguro antes de hacer toLowerCase
    const userName = p.usuario?.name || "";
    const concepto = p.concepto || "";
    const mes = p.mes || "";
    const unidad = p.usuario?.unidad || "";
    
    const matchSearch = 
      userName.toLowerCase().includes(search.toLowerCase()) ||
      concepto.toLowerCase().includes(search.toLowerCase()) ||
      mes.toLowerCase().includes(search.toLowerCase()) ||
      unidad.toLowerCase().includes(search.toLowerCase());
    
    const matchConcepto = filterConcepto === "all" || p.concepto === filterConcepto;
    const matchEstado = filterEstado === "all" || p.estado === filterEstado;

    return matchSearch && matchConcepto && matchEstado;
  });

  // Calcular totales
  const totalPendiente = pagos
    .filter(p => p.estado === "Pendiente" || p.estado === "Vencido")
    .reduce((sum, p) => sum + p.monto, 0);

  const totalPagado = pagos
    .filter(p => p.estado === "Pagado")
    .reduce((sum, p) => sum + p.monto, 0);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>💰 Gestión de Pagos</h1>
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
          <span>Pagos</span>
        </div>

        {/* Controles */}
        <div className="page-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="🔍 Buscar por usuario, concepto o mes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="filters">
            <select
              value={filterConcepto}
              onChange={(e) => setFilterConcepto(e.target.value)}
              className="filter-select"
            >
              <option value="all">💼 Todos los conceptos</option>
              {CONCEPTOS.map((concepto) => (
                <option key={concepto} value={concepto}>
                  {getConceptoIcon(concepto)} {concepto}
                </option>
              ))}
            </select>

            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="filter-select"
            >
              <option value="all">📊 Todos los estados</option>
              <option value="Pendiente">⏳ Pendiente</option>
              <option value="Pagado">✅ Pagado</option>
              <option value="Vencido">⚠️ Vencido</option>
            </select>
          </div>

          {isAdmin && (
            <button className="btn-create" onClick={openCreateModal}>
              ➕ Registrar Pago
            </button>
          )}
        </div>

        {/* Estadísticas rápidas */}
        <div className="mini-stats">
          <div className="mini-stat">
            <span className="mini-stat-label">Total Pagos</span>
            <span className="mini-stat-value">{pagos.length}</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Pendientes</span>
            <span className="mini-stat-value warning">
              {pagos.filter((p) => p.estado === "Pendiente").length}
            </span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Pagados</span>
            <span className="mini-stat-value success">
              {pagos.filter((p) => p.estado === "Pagado").length}
            </span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-label">Vencidos</span>
            <span className="mini-stat-value danger">
              {pagos.filter((p) => isVencido(p)).length}
            </span>
          </div>
        </div>

        {/* Totales financieros */}
        {isAdmin && (
          <div className="financial-summary">
            <div className="financial-card pending">
              <span className="financial-label">💸 Por Cobrar</span>
              <span className="financial-amount">${totalPendiente.toFixed(2)}</span>
            </div>
            <div className="financial-card paid">
              <span className="financial-label">✅ Cobrado</span>
              <span className="financial-amount">${totalPagado.toFixed(2)}</span>
            </div>
            <div className="financial-card total">
              <span className="financial-label">💰 Total</span>
              <span className="financial-amount">${(totalPendiente + totalPagado).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Tabla de pagos */}
        {loading ? (
          <div className="loading">Cargando pagos...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {isAdmin && <th>Usuario</th>}
                  <th>Concepto</th>
                  <th>Mes/Periodo</th>
                  <th>Monto</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  {isAdmin && <th>Método Pago</th>}
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 6} className="empty-table">
                      No se encontraron pagos
                    </td>
                  </tr>
                ) : (
                  pagosFiltrados.map((pago) => (
                    <tr key={pago._id} className={isVencido(pago) ? "row-vencido" : ""}>
                      {isAdmin && (
                        <td>
                          <div className="user-cell">
                            <span className="user-avatar">
                              {pago.usuario?.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                            <div className="user-info-cell">
                              <span>{pago.usuario?.name || "Desconocido"}</span>
                              {pago.usuario?.unidad && (
                                <small>{pago.usuario.unidad}</small>
                              )}
                            </div>
                          </div>
                        </td>
                      )}
                      <td>
                        <div className="concepto-cell">
                          <span className="concepto-icon">{getConceptoIcon(pago.concepto)}</span>
                          <strong>{pago.concepto}</strong>
                        </div>
                      </td>
                      <td>{pago.mes || "-"}</td>
                      <td>
                        <span className="monto-cell">${pago.monto.toFixed(2)}</span>
                      </td>
                      <td>
                        <div className="fecha-cell">
                          📅 {new Date(pago.fechaVencimiento).toLocaleDateString("es-MX", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                          {isVencido(pago) && <span className="badge-vencido">Vencido</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`estado-badge ${pago.estado.toLowerCase()}`}>
                          {getEstadoIcon(pago.estado)} {pago.estado}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          <span className="metodo-pago">
                            {pago.metodoPago || "-"}
                          </span>
                        </td>
                      )}
                      <td>
                        <div className="table-actions">
                          {isAdmin && pago.estado !== "Pagado" && (
                            <button
                              className="btn-table pay"
                              onClick={() => openPagoModal(pago)}
                              title="Marcar como pagado"
                            >
                              💳
                            </button>
                          )}
                          {isAdmin && (
                            <>
                              <button
                                className="btn-table edit"
                                onClick={() => openEditModal(pago)}
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                className="btn-table delete"
                                onClick={() => handleEliminar(pago)}
                                title="Eliminar"
                              >
                                🗑️
                              </button>
                            </>
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
              <h2>{editingPago ? "✏️ Editar Pago" : "➕ Registrar Nuevo Pago"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Usuario *</label>
                  <select
                    value={formData.usuario}
                    onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar usuario</option>
                    {usuarios.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} {u.unidad ? `- ${u.unidad}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Concepto *</label>
                  <select
                    value={formData.concepto}
                    onChange={(e) => setFormData({ ...formData, concepto: e.target.value as any })}
                    required
                  >
                    {CONCEPTOS.map((concepto) => (
                      <option key={concepto} value={concepto}>
                        {getConceptoIcon(concepto)} {concepto}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Monto ($) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mes/Periodo</label>
                  <input
                    type="text"
                    placeholder="Ej: Enero 2024"
                    value={formData.mes}
                    onChange={(e) => setFormData({ ...formData, mes: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Fecha Vencimiento *</label>
                  <input
                    type="date"
                    value={formData.fechaVencimiento}
                    onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Estado *</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                    required
                  >
                    <option value="Pendiente">⏳ Pendiente</option>
                    <option value="Pagado">✅ Pagado</option>
                    <option value="Vencido">⚠️ Vencido</option>
                  </select>
                </div>

                {formData.estado === "Pagado" && (
                  <div className="form-group">
                    <label>Método de Pago</label>
                    <select
                      value={formData.metodoPago}
                      onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                    >
                      <option value="">Seleccionar método</option>
                      {METODOS_PAGO.map((metodo) => (
                        <option key={metodo} value={metodo}>{metodo}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group full-width">
                  <label>Notas (opcional)</label>
                  <textarea
                    rows={2}
                    placeholder="Información adicional..."
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
                  {editingPago ? "Guardar Cambios" : "Registrar Pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de marcar como pagado */}
      {showPagoModal && pagoToMark && (
        <div className="modal-overlay" onClick={() => setShowPagoModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💳 Registrar Pago</h2>
              <button className="modal-close" onClick={() => setShowPagoModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="pago-info">
              <p><strong>Usuario:</strong> {pagoToMark.usuario.name}</p>
              <p><strong>Concepto:</strong> {pagoToMark.concepto}</p>
              <p><strong>Monto:</strong> ${pagoToMark.monto.toFixed(2)}</p>
            </div>

            <form onSubmit={handleMarcarPagado}>
              <div className="form-group">
                <label>Método de Pago *</label>
                <select
                  value={pagoData.metodoPago}
                  onChange={(e) => setPagoData({ ...pagoData, metodoPago: e.target.value })}
                  required
                >
                  {METODOS_PAGO.map((metodo) => (
                    <option key={metodo} value={metodo}>{metodo}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Fecha de Pago *</label>
                <input
                  type="date"
                  value={pagoData.fechaPago}
                  onChange={(e) => setPagoData({ ...pagoData, fechaPago: e.target.value })}
                  required
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowPagoModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  ✅ Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}