import { useState, useEffect, useRef } from "react";
import { api, getUser, clearAuth } from "../api";
import { useNavigate, Link } from "react-router-dom";

interface Mensaje {
  _id: string;
  de: {
    _id: string;
    name: string;
    role: string;
  };
  para: {
    _id: string;
    name: string;
    role: string;
  } | null;
  mensaje: string;
  leido: boolean;
  esDelAdmin: boolean;
  createdAt: string;
}

interface Conversacion {
  usuario: {
    _id: string;
    name: string;
    email: string;
    unidad: string;
    role: string;
  };
  ultimoMensaje: string;
  ultimaFecha: string;
  noLeidos: number;
}

export default function Chat() {
  const user = getUser();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Solo para admin
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === "admin") {
      cargarConversaciones();
    } else {
      cargarMensajes();
    }
  }, [usuarioSeleccionado]);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  // Auto-refresh cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.role === "admin" && usuarioSeleccionado) {
        cargarMensajes(true);
      } else if (user?.role === "usuario") {
        cargarMensajes(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [usuarioSeleccionado]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function cargarConversaciones() {
    try {
      const { data } = await api.get("/mensajes/conversaciones");
      setConversaciones(data.conversaciones || []);
      
      // Seleccionar automáticamente la primera conversación
      if (data.conversaciones && data.conversaciones.length > 0 && !usuarioSeleccionado) {
        setUsuarioSeleccionado(data.conversaciones[0].usuario._id);
      }
    } catch (error: any) {
      console.error("Error cargando conversaciones:", error);
    }
  }

  async function cargarMensajes(silent = false) {
    try {
      if (!silent) setLoading(true);

      const params = user?.role === "admin" && usuarioSeleccionado
        ? { conUsuarioId: usuarioSeleccionado }
        : {};

      const { data } = await api.get("/mensajes/conversacion", { params });
      setMensajes(data.mensajes || []);

      // Marcar como leídos
      if (user?.role === "admin" && usuarioSeleccionado) {
        await api.put("/mensajes/marcar-leido", { conUsuarioId: usuarioSeleccionado });
      } else {
        await api.put("/mensajes/marcar-leido");
      }
    } catch (error: any) {
      console.error("Error cargando mensajes:", error);
      if (error.response?.status === 401) {
        clearAuth();
        navigate("/login");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function handleEnviarMensaje(e: React.FormEvent) {
    e.preventDefault();

    if (!nuevoMensaje.trim()) return;

    try {
      setSending(true);

      const body = user?.role === "admin"
        ? { para: usuarioSeleccionado, mensaje: nuevoMensaje }
        : { mensaje: nuevoMensaje };

      await api.post("/mensajes", body);
      setNuevoMensaje("");
      
      // Recargar mensajes
      await cargarMensajes(true);

      // Si es admin, recargar lista de conversaciones
      if (user?.role === "admin") {
        await cargarConversaciones();
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Error enviando mensaje");
    } finally {
      setSending(false);
    }
  }

  function handleLogout() {
    clearAuth();
    navigate("/login");
  }

  function seleccionarConversacion(usuarioId: string) {
    setUsuarioSeleccionado(usuarioId);
    setMensajes([]);
  }

  const conversacionActual = conversaciones.find(c => c.usuario._id === usuarioSeleccionado);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>💬 Chat</h1>
        <div className="user-info">
          <span>👤 {user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="page-content">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to={user?.role === "admin" ? "/admin/dashboard" : "/dashboard"}>
            Dashboard
          </Link>
          <span className="separator">›</span>
          <span>Chat</span>
        </div>

        <div className="chat-container">
          {/* ADMIN: Lista de conversaciones */}
          {user?.role === "admin" && (
            <div className="chat-sidebar">
              <h3>Conversaciones</h3>
              {conversaciones.length === 0 ? (
                <p className="empty">No hay conversaciones</p>
              ) : (
                <div className="conversaciones-list">
                  {conversaciones.map((conv) => (
                    <div
                      key={conv.usuario._id}
                      className={`conversacion-item ${usuarioSeleccionado === conv.usuario._id ? "active" : ""}`}
                      onClick={() => seleccionarConversacion(conv.usuario._id)}
                    >
                      <div className="conversacion-header">
                        <span className="conversacion-avatar">
                          {conv.usuario.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="conversacion-info">
                          <h4>{conv.usuario.name}</h4>
                          <p className="conversacion-unidad">{conv.usuario.unidad || "Sin unidad"}</p>
                        </div>
                        {conv.noLeidos > 0 && (
                          <span className="badge-unread">{conv.noLeidos}</span>
                        )}
                      </div>
                      <p className="ultimo-mensaje">{conv.ultimoMensaje}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* USUARIO o ADMIN con conversación seleccionada */}
          {(user?.role === "usuario" || (user?.role === "admin" && usuarioSeleccionado)) && (
            <div className="chat-main">
              {/* Header de la conversación */}
              {user?.role === "admin" && conversacionActual && (
                <div className="chat-header">
                  <span className="chat-avatar">
                    {conversacionActual.usuario.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h3>{conversacionActual.usuario.name}</h3>
                    <p>{conversacionActual.usuario.unidad || "Sin unidad"}</p>
                  </div>
                </div>
              )}

              {user?.role === "usuario" && (
                <div className="chat-header">
                  <span className="chat-avatar">👑</span>
                  <div>
                    <h3>Administración</h3>
                    <p>Chat con el administrador</p>
                  </div>
                </div>
              )}

              {/* Mensajes */}
              <div className="chat-messages">
                {loading ? (
                  <div className="loading">Cargando mensajes...</div>
                ) : mensajes.length === 0 ? (
                  <div className="empty">
                    No hay mensajes. ¡Inicia la conversación! 👋
                  </div>
                ) : (
                  mensajes.map((msg) => (
                    <div
                      key={msg._id}
                      className={`mensaje ${msg.de._id === user?._id ? "propio" : "otro"}`}
                    >
                      <div className="mensaje-content">
                        <p className="mensaje-texto">{msg.mensaje}</p>
                        <span className="mensaje-fecha">
                          {new Date(msg.createdAt).toLocaleString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de mensaje */}
              <form onSubmit={handleEnviarMensaje} className="chat-input-form">
                <input
                  type="text"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  disabled={sending}
                  className="chat-input"
                />
                <button type="submit" disabled={sending || !nuevoMensaje.trim()} className="btn-send">
                  {sending ? "..." : "Enviar"}
                </button>
              </form>
            </div>
          )}

          {/* ADMIN sin conversación seleccionada */}
          {user?.role === "admin" && !usuarioSeleccionado && conversaciones.length > 0 && (
            <div className="chat-main empty-state">
              <p>Selecciona una conversación para comenzar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}