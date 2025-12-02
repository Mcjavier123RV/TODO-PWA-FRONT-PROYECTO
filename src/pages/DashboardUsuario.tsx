import { useState, useEffect } from "react";
import { api, getUser, clearAuth } from "../api";
import { Link, useNavigate } from "react-router-dom";

export default function DashboardUsuario() {
  const user = getUser();
  const navigate = useNavigate();
  const [anuncios, setAnuncios] = useState<any[]>([]);
  const [misReservaciones, setMisReservaciones] = useState<any[]>([]);
  const [misPagos, setMisPagos] = useState<any[]>([]);
  const [misVisitantes, setMisVisitantes] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [anunciosRes, reservacionesRes, pagosRes, visitantesRes] = await Promise.all([
        api.get("/anuncios"),
        api.get("/reservaciones/mis-reservaciones"),
        api.get("/pagos/mis-pagos?estado=Pendiente"),
        api.get("/visitantes/mis-visitas"),
      ]);

      setAnuncios(anunciosRes.data.anuncios?.slice(0, 3) || []);
      setMisReservaciones(reservacionesRes.data.reservaciones?.slice(0, 3) || []);
      setMisPagos(pagosRes.data.pagos?.slice(0, 3) || []);
      setMisVisitantes(visitantesRes.data.visitantes?.slice(0, 3) || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  }

  function handleLogout() {
    clearAuth();
    navigate("/login");
  }

  // Contar totales
  const totalPagosPendientes = misPagos.reduce((sum, pago) => sum + pago.monto, 0);
  const reservacionesActivas = misReservaciones.filter(r => r.estado === 'Confirmada').length;
  const visitantesPendientes = misVisitantes.filter(v => v.estado === 'Pendiente' || v.estado === 'Aprobada').length;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Mi Portal</h1>
        <div className="user-info">
          <span>👤 {user?.name}</span>
          {user?.unidad && <span className="unidad">🏠 {user?.unidad}</span>}
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Bienvenida */}
      <div className="welcome-section">
        <h2>Bienvenido, {user?.name}</h2>
        {user?.unidad && <p>Unidad: {user?.unidad}</p>}
      </div>

      {/* Mini estadísticas */}
      <div className="mini-stats">
        <div className="mini-stat">
          <span className="mini-stat-label">Reservaciones Activas</span>
          <span className="mini-stat-value success">{reservacionesActivas}</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Pagos Pendientes</span>
          <span className="mini-stat-value danger">{misPagos.length}</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Total a Pagar</span>
          <span className="mini-stat-value warning">${totalPagosPendientes.toFixed(2)}</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Visitantes Próximos</span>
          <span className="mini-stat-value">{visitantesPendientes}</span>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="quick-actions">
        <h3>Acciones Rápidas</h3>
        <div className="actions-grid">
          <Link to="/reservaciones" className="action-btn">
            <span className="action-icon">📅</span>
            <span>Reservar Área</span>
          </Link>

          <Link to="/visitantes" className="action-btn">
            <span className="action-icon">🚗</span>
            <span>Registrar Visita</span>
          </Link>

          <Link to="/anuncios" className="action-btn">
            <span className="action-icon">📢</span>
            <span>Ver Anuncios</span>
          </Link>

          <Link to="/pagos" className="action-btn">
            <span className="action-icon">💰</span>
            <span>Mis Pagos</span>
          </Link>

          <Link to="/chat" className="action-btn">
            <span className="action-icon">💬</span>
            <span>Chat con Admin</span>
            </Link>

          <Link to="/encuestas" className="action-btn">
            <span className="action-icon">📊</span>
            <span>Encuestas</span>
            </Link>

        </div>
      </div>

      {/* Secciones principales */}
      <div className="user-sections">
        {/* Anuncios recientes */}
        <section className="section-card">
          <div className="section-header">
            <h3>📢 Anuncios Recientes</h3>
            <Link to="/anuncios" className="see-all">
              Ver todos →
            </Link>
          </div>
          {anuncios.length > 0 ? (
            <div className="list">
              {anuncios.map((anuncio) => (
                <div key={anuncio._id} className="list-item">
                  <div className="list-item-header">
                    <h4>{anuncio.titulo}</h4>
                    <span className={`badge badge-${anuncio.prioridad?.toLowerCase() || 'media'}`}>
                      {anuncio.prioridad || 'Media'}
                    </span>
                  </div>
                  <p className="list-item-desc">
                    {anuncio.descripcion.length > 80 
                      ? `${anuncio.descripcion.substring(0, 80)}...` 
                      : anuncio.descripcion}
                  </p>
                  <small className="list-item-meta">
                    {anuncio.tipo} • {new Date(anuncio.createdAt).toLocaleDateString('es-MX')}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">No hay anuncios recientes</p>
          )}
        </section>

        {/* Mis reservaciones */}
        <section className="section-card">
          <div className="section-header">
            <h3>📅 Mis Reservaciones</h3>
            <Link to="/reservaciones" className="see-all">
              Ver todas →
            </Link>
          </div>
          {misReservaciones.length > 0 ? (
            <div className="list">
              {misReservaciones.map((res) => (
                <div key={res._id} className="list-item">
                  <div className="list-item-header">
                    <h4>{res.area}</h4>
                    <span className={`badge badge-${res.estado?.toLowerCase() || 'pendiente'}`}>
                      {res.estado || 'Pendiente'}
                    </span>
                  </div>
                  <p className="list-item-desc">
                    📅 {new Date(res.fecha).toLocaleDateString('es-MX', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                  <small className="list-item-meta">
                    🕐 {res.horaInicio} - {res.horaFin}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">No tienes reservaciones activas</p>
          )}
        </section>

        {/* Pagos pendientes */}
        <section className="section-card">
          <div className="section-header">
            <h3>💰 Pagos Pendientes</h3>
            <Link to="/pagos" className="see-all">
              Ver todos →
            </Link>
          </div>
          {misPagos.length > 0 ? (
            <div className="list">
              {misPagos.map((pago) => (
                <div key={pago._id} className="list-item">
                  <div className="list-item-header">
                    <h4>{pago.concepto}</h4>
                    <span className="amount-badge">${pago.monto.toFixed(2)}</span>
                  </div>
                  <p className="list-item-desc">{pago.mes || 'Sin periodo especificado'}</p>
                  <small className="list-item-meta">
                    ⏰ Vence: {new Date(pago.fechaVencimiento).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">✅ No tienes pagos pendientes</p>
          )}
        </section>

        {/* Mis visitantes */}
        <section className="section-card">
          <div className="section-header">
            <h3>🚗 Mis Visitantes</h3>
            <Link to="/visitantes" className="see-all">
              Ver todos →
            </Link>
          </div>
          {misVisitantes.length > 0 ? (
            <div className="list">
              {misVisitantes.map((visitante) => (
                <div key={visitante._id} className="list-item">
                  <div className="list-item-header">
                    <h4>👤 {visitante.nombreVisitante}</h4>
                    <span className={`badge badge-${visitante.estado?.toLowerCase() || 'pendiente'}`}>
                      {visitante.estado || 'Pendiente'}
                    </span>
                  </div>
                  <p className="list-item-desc">
                    📅 {new Date(visitante.fechaVisita).toLocaleDateString('es-MX', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short'
                    })}
                  </p>
                  <small className="list-item-meta">
                    🕐 {visitante.horaLlegada}
                    {visitante.vehiculo?.placas && ` • 🚗 ${visitante.vehiculo.placas}`}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">No tienes visitantes registrados</p>
          )}
        </section>
      </div>
    </div>
  );
}