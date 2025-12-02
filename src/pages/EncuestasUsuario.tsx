import { useState, useEffect } from "react";
import { api, getUser, clearAuth } from "../api";
import { useNavigate, Link } from "react-router-dom";

interface Encuesta {
  _id: string;
  titulo: string;
  descripcion: string;
  preguntas: Array<{
    _id: string;
    textoPregunta: string;
    tipoPregunta: string;
    opciones?: string[];
    escalaMin?: number;
    escalaMax?: number;
  }>;
  activa: boolean;
  yaRespondio: boolean;
  createdAt: string;
}

export default function EncuestasUsuario() {
  const user = getUser();
  const navigate = useNavigate();
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondiendo, setRespondiendo] = useState<string | null>(null);
  const [encuestaActual, setEncuestaActual] = useState<Encuesta | null>(null);
  const [respuestas, setRespuestas] = useState<any[]>([]);

  useEffect(() => {
    cargarEncuestas();
  }, []);

  async function cargarEncuestas() {
    try {
      setLoading(true);
      const { data } = await api.get("/encuestas");
      setEncuestas(data.encuestas || []);
    } catch (error: any) {
      console.error("Error cargando encuestas:", error);
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

  async function iniciarEncuesta(encuesta: Encuesta) {
    setEncuestaActual(encuesta);
    setRespondiendo(encuesta._id);
    
    // Inicializar respuestas vacías
    const respuestasVacias = encuesta.preguntas.map((pregunta) => ({
      preguntaId: pregunta._id,
      respuesta:
        pregunta.tipoPregunta === "opcion_multiple"
          ? ""
          : pregunta.tipoPregunta === "escala"
          ? pregunta.escalaMin
          : "",
    }));
    setRespuestas(respuestasVacias);
  }

  function actualizarRespuesta(index: number, valor: any) {
    const nuevasRespuestas = [...respuestas];
    nuevasRespuestas[index].respuesta = valor;
    setRespuestas(nuevasRespuestas);
  }

  async function enviarRespuestas(e: React.FormEvent) {
    e.preventDefault();

    // Validar que todas las preguntas estén respondidas
    for (let i = 0; i < respuestas.length; i++) {
      const respuesta = respuestas[i];
      if (
        respuesta.respuesta === "" ||
        respuesta.respuesta === null ||
        respuesta.respuesta === undefined
      ) {
        alert(`Por favor responde la pregunta ${i + 1}`);
        return;
      }
    }

    try {
      await api.post(`/encuestas/${respondiendo}/responder`, { respuestas });
      alert("¡Gracias por responder la encuesta!");
      setRespondiendo(null);
      setEncuestaActual(null);
      setRespuestas([]);
      cargarEncuestas();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error enviando respuestas");
    }
  }

  function cancelarEncuesta() {
    setRespondiendo(null);
    setEncuestaActual(null);
    setRespuestas([]);
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>📊 Encuestas</h1>
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
          <Link to="/dashboard">Dashboard</Link>
          <span className="separator">›</span>
          <span>Encuestas</span>
        </div>

        {/* Si está respondiendo una encuesta */}
        {respondiendo && encuestaActual ? (
          <div className="encuesta-responder">
            <div className="encuesta-responder-header">
              <h2>{encuestaActual.titulo}</h2>
              {encuestaActual.descripcion && <p>{encuestaActual.descripcion}</p>}
            </div>

            <form onSubmit={enviarRespuestas}>
              {encuestaActual.preguntas.map((pregunta, index) => (
                <div key={pregunta._id} className="pregunta-responder">
                  <h3>
                    {index + 1}. {pregunta.textoPregunta}
                  </h3>

                  {/* Opción múltiple */}
                  {pregunta.tipoPregunta === "opcion_multiple" && (
                    <div className="opciones-respuesta">
                      {pregunta.opciones?.map((opcion, opcionIndex) => (
                        <label key={opcionIndex} className="opcion-radio">
                          <input
                            type="radio"
                            name={`pregunta-${index}`}
                            value={opcion}
                            checked={respuestas[index]?.respuesta === opcion}
                            onChange={(e) =>
                              actualizarRespuesta(index, e.target.value)
                            }
                            required
                          />
                          <span>{opcion}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Texto libre */}
                  {pregunta.tipoPregunta === "texto_libre" && (
                    <textarea
                      value={respuestas[index]?.respuesta || ""}
                      onChange={(e) => actualizarRespuesta(index, e.target.value)}
                      placeholder="Escribe tu respuesta aquí..."
                      required
                      rows={4}
                    />
                  )}

                  {/* Escala */}
                  {pregunta.tipoPregunta === "escala" && (
                    <div className="escala-respuesta">
                      <div className="escala-labels">
                        <span>{pregunta.escalaMin}</span>
                        <span>{pregunta.escalaMax}</span>
                      </div>
                      <input
                        type="range"
                        min={pregunta.escalaMin}
                        max={pregunta.escalaMax}
                        value={respuestas[index]?.respuesta || pregunta.escalaMin}
                        onChange={(e) =>
                          actualizarRespuesta(index, parseInt(e.target.value))
                        }
                        className="escala-slider"
                      />
                      <div className="escala-value">
                        Valor seleccionado: {respuestas[index]?.respuesta}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="encuesta-responder-actions">
                <button type="button" className="btn-cancel" onClick={cancelarEncuesta}>
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  Enviar Respuestas
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Lista de encuestas disponibles */
          <>
            <h2>Encuestas Disponibles</h2>

            {loading ? (
              <div className="loading">Cargando encuestas...</div>
            ) : encuestas.length === 0 ? (
              <div className="empty">
                <p>No hay encuestas disponibles en este momento</p>
              </div>
            ) : (
              <div className="encuestas-list-usuario">
                {encuestas.map((encuesta) => (
                  <div
                    key={encuesta._id}
                    className={`encuesta-card-usuario ${
                      encuesta.yaRespondio ? "respondida" : ""
                    }`}
                  >
                    <div className="encuesta-header-usuario">
                      <h3>{encuesta.titulo}</h3>
                      {encuesta.yaRespondio ? (
                        <span className="badge-respondida">✓ Respondida</span>
                      ) : (
                        <span className="badge-pendiente">Pendiente</span>
                      )}
                    </div>

                    {encuesta.descripcion && (
                      <p className="encuesta-descripcion">{encuesta.descripcion}</p>
                    )}

                    <div className="encuesta-info">
                      <span>📋 {encuesta.preguntas.length} preguntas</span>
                    </div>

                    {!encuesta.yaRespondio && (
                      <button
                        className="btn-responder"
                        onClick={() => iniciarEncuesta(encuesta)}
                      >
                        Responder Encuesta
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}