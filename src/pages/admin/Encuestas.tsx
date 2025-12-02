import { useState, useEffect } from "react";
import { api, getUser, clearAuth } from "../../api";
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
  fechaCierre: string | null;
  anonima: boolean;
  createdAt: string;
}

export default function Encuestas() {
  const user = getUser();
  const navigate = useNavigate();
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewResults, setViewResults] = useState<string | null>(null);
  const [resultados, setResultados] = useState<any>(null);

  // Formulario para crear encuesta
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    anonima: false,
    preguntas: [
      {
        textoPregunta: "",
        tipoPregunta: "opcion_multiple",
        opciones: ["", ""],
        escalaMin: 1,
        escalaMax: 5,
      },
    ],
  });

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

  function agregarPregunta() {
    setFormData({
      ...formData,
      preguntas: [
        ...formData.preguntas,
        {
          textoPregunta: "",
          tipoPregunta: "opcion_multiple",
          opciones: ["", ""],
          escalaMin: 1,
          escalaMax: 5,
        },
      ],
    });
  }

  function eliminarPregunta(index: number) {
    const nuevasPreguntas = formData.preguntas.filter((_, i) => i !== index);
    setFormData({ ...formData, preguntas: nuevasPreguntas });
  }

  function actualizarPregunta(index: number, campo: string, valor: any) {
    const nuevasPreguntas = [...formData.preguntas];
    nuevasPreguntas[index] = { ...nuevasPreguntas[index], [campo]: valor };
    setFormData({ ...formData, preguntas: nuevasPreguntas });
  }

  function agregarOpcion(preguntaIndex: number) {
    const nuevasPreguntas = [...formData.preguntas];
    nuevasPreguntas[preguntaIndex].opciones.push("");
    setFormData({ ...formData, preguntas: nuevasPreguntas });
  }

  function actualizarOpcion(preguntaIndex: number, opcionIndex: number, valor: string) {
    const nuevasPreguntas = [...formData.preguntas];
    nuevasPreguntas[preguntaIndex].opciones[opcionIndex] = valor;
    setFormData({ ...formData, preguntas: nuevasPreguntas });
  }

  function eliminarOpcion(preguntaIndex: number, opcionIndex: number) {
    const nuevasPreguntas = [...formData.preguntas];
    nuevasPreguntas[preguntaIndex].opciones = nuevasPreguntas[
      preguntaIndex
    ].opciones.filter((_, i) => i !== opcionIndex);
    setFormData({ ...formData, preguntas: nuevasPreguntas });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validaciones
    if (!formData.titulo.trim()) {
      alert("El título es requerido");
      return;
    }

    if (formData.preguntas.length === 0) {
      alert("Debes agregar al menos una pregunta");
      return;
    }

    for (let i = 0; i < formData.preguntas.length; i++) {
      const pregunta = formData.preguntas[i];
      if (!pregunta.textoPregunta.trim()) {
        alert(`La pregunta ${i + 1} no puede estar vacía`);
        return;
      }

      if (
        pregunta.tipoPregunta === "opcion_multiple" &&
        pregunta.opciones.filter((o) => o.trim()).length < 2
      ) {
        alert(`La pregunta ${i + 1} debe tener al menos 2 opciones`);
        return;
      }
    }

    try {
      // Limpiar datos antes de enviar
      const datosLimpios = {
        ...formData,
        preguntas: formData.preguntas.map((p) => ({
          textoPregunta: p.textoPregunta.trim(),
          tipoPregunta: p.tipoPregunta,
          opciones:
            p.tipoPregunta === "opcion_multiple"
              ? p.opciones.filter((o) => o.trim())
              : undefined,
          escalaMin: p.tipoPregunta === "escala" ? p.escalaMin : undefined,
          escalaMax: p.tipoPregunta === "escala" ? p.escalaMax : undefined,
        })),
      };

      await api.post("/encuestas", datosLimpios);
      alert("Encuesta creada exitosamente");
      setShowModal(false);
      resetForm();
      cargarEncuestas();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error creando encuesta");
    }
  }

  function resetForm() {
    setFormData({
      titulo: "",
      descripcion: "",
      anonima: false,
      preguntas: [
        {
          textoPregunta: "",
          tipoPregunta: "opcion_multiple",
          opciones: ["", ""],
          escalaMin: 1,
          escalaMax: 5,
        },
      ],
    });
  }

  async function cerrarEncuesta(id: string) {
    if (!confirm("¿Deseas cerrar esta encuesta? Los usuarios ya no podrán responder.")) {
      return;
    }

    try {
      await api.patch(`/encuestas/${id}/cerrar`);
      alert("Encuesta cerrada exitosamente");
      cargarEncuestas();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error cerrando encuesta");
    }
  }

  async function eliminarEncuesta(id: string) {
    if (
      !confirm(
        "¿Deseas eliminar esta encuesta? Se eliminarán también todas las respuestas."
      )
    ) {
      return;
    }

    try {
      await api.delete(`/encuestas/${id}`);
      alert("Encuesta eliminada exitosamente");
      cargarEncuestas();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error eliminando encuesta");
    }
  }

  async function verResultados(id: string) {
    try {
      const { data } = await api.get(`/encuestas/${id}/resultados`);
      setResultados(data);
      setViewResults(id);
    } catch (error: any) {
      alert(error.response?.data?.message || "Error cargando resultados");
    }
  }

  async function exportarResultados(id: string) {
    try {
      const { data } = await api.get(`/encuestas/${id}/exportar`);
      
      // Convertir a CSV
      const csv = convertirACSV(data.datos);
      
      // Descargar archivo
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `encuesta_${id}_resultados.csv`;
      a.click();
      
      alert("Resultados exportados exitosamente");
    } catch (error: any) {
      alert(error.response?.data?.message || "Error exportando resultados");
    }
  }

  function convertirACSV(datos: any[]) {
    if (datos.length === 0) return "";

    const headers = Object.keys(datos[0]).join(",");
    const rows = datos.map((row) => Object.values(row).join(",")).join("\n");

    return headers + "\n" + rows;
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>📊 Gestión de Encuestas</h1>
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
          <Link to="/admin/dashboard">Dashboard</Link>
          <span className="separator">›</span>
          <span>Encuestas</span>
        </div>

        {/* Controles */}
        <div className="page-controls">
          <h2>Encuestas</h2>
          <button className="btn-create" onClick={() => setShowModal(true)}>
            ➕ Nueva Encuesta
          </button>
        </div>

        {/* Lista de encuestas */}
        {loading ? (
          <div className="loading">Cargando encuestas...</div>
        ) : encuestas.length === 0 ? (
          <div className="empty">
            <p>No hay encuestas creadas</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              Crear primera encuesta
            </button>
          </div>
        ) : (
          <div className="encuestas-grid">
            {encuestas.map((encuesta) => (
              <div key={encuesta._id} className="encuesta-card">
                <div className="encuesta-header">
                  <h3>{encuesta.titulo}</h3>
                  <span
                    className={`status-badge ${encuesta.activa ? "active" : "inactive"}`}
                  >
                    {encuesta.activa ? "Activa" : "Cerrada"}
                  </span>
                </div>

                {encuesta.descripcion && (
                  <p className="encuesta-descripcion">{encuesta.descripcion}</p>
                )}

                <div className="encuesta-info">
                  <span>📋 {encuesta.preguntas.length} preguntas</span>
                  {encuesta.anonima && <span>🔒 Anónima</span>}
                </div>

                <div className="encuesta-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => verResultados(encuesta._id)}
                  >
                    Ver Resultados
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => exportarResultados(encuesta._id)}
                  >
                    Exportar CSV
                  </button>
                  {encuesta.activa && (
                    <button
                      className="btn-warning"
                      onClick={() => cerrarEncuesta(encuesta._id)}
                    >
                      Cerrar
                    </button>
                  )}
                  <button
                    className="btn-danger"
                    onClick={() => eliminarEncuesta(encuesta._id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de crear encuesta */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>➕ Nueva Encuesta</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>Información General</h3>

                <div className="form-group">
                  <label>Título de la Encuesta *</label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData({ ...formData, titulo: e.target.value })
                    }
                    placeholder="Ej: Encuesta de Satisfacción"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    placeholder="Describe brevemente el propósito de la encuesta"
                  />
                </div>

                <div className="form-group-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.anonima}
                      onChange={(e) =>
                        setFormData({ ...formData, anonima: e.target.checked })
                      }
                    />
                    <span>Encuesta anónima (no se mostrarán los nombres de quien responde)</span>
                  </label>
                </div>
              </div>

              <div className="form-section">
                <div className="section-header-with-button">
                  <h3>Preguntas</h3>
                  <button
                    type="button"
                    className="btn-add-small"
                    onClick={agregarPregunta}
                  >
                    ➕ Agregar Pregunta
                  </button>
                </div>

                {formData.preguntas.map((pregunta, preguntaIndex) => (
                  <div key={preguntaIndex} className="pregunta-card">
                    <div className="pregunta-header">
                      <h4>Pregunta {preguntaIndex + 1}</h4>
                      {formData.preguntas.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove-small"
                          onClick={() => eliminarPregunta(preguntaIndex)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Texto de la pregunta *</label>
                      <input
                        type="text"
                        value={pregunta.textoPregunta}
                        onChange={(e) =>
                          actualizarPregunta(
                            preguntaIndex,
                            "textoPregunta",
                            e.target.value
                          )
                        }
                        placeholder="Escribe tu pregunta aquí"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Tipo de pregunta</label>
                      <select
                        value={pregunta.tipoPregunta}
                        onChange={(e) =>
                          actualizarPregunta(
                            preguntaIndex,
                            "tipoPregunta",
                            e.target.value
                          )
                        }
                      >
                        <option value="opcion_multiple">Opción Múltiple</option>
                        <option value="texto_libre">Texto Libre</option>
                        <option value="escala">Escala Numérica</option>
                      </select>
                    </div>

                    {/* Opciones para opción múltiple */}
                    {pregunta.tipoPregunta === "opcion_multiple" && (
                      <div className="opciones-container">
                        <label>Opciones de respuesta:</label>
                        {pregunta.opciones.map((opcion, opcionIndex) => (
                          <div key={opcionIndex} className="opcion-input-group">
                            <input
                              type="text"
                              value={opcion}
                              onChange={(e) =>
                                actualizarOpcion(
                                  preguntaIndex,
                                  opcionIndex,
                                  e.target.value
                                )
                              }
                              placeholder={`Opción ${opcionIndex + 1}`}
                            />
                            {pregunta.opciones.length > 2 && (
                              <button
                                type="button"
                                className="btn-remove-option"
                                onClick={() =>
                                  eliminarOpcion(preguntaIndex, opcionIndex)
                                }
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn-add-option"
                          onClick={() => agregarOpcion(preguntaIndex)}
                        >
                          ➕ Agregar opción
                        </button>
                      </div>
                    )}

                    {/* Configuración de escala */}
                    {pregunta.tipoPregunta === "escala" && (
                      <div className="escala-config">
                        <div className="form-row">
                          <div className="form-group">
                            <label>Valor mínimo</label>
                            <input
                              type="number"
                              value={pregunta.escalaMin}
                              onChange={(e) =>
                                actualizarPregunta(
                                  preguntaIndex,
                                  "escalaMin",
                                  parseInt(e.target.value)
                                )
                              }
                              min="0"
                            />
                          </div>
                          <div className="form-group">
                            <label>Valor máximo</label>
                            <input
                              type="number"
                              value={pregunta.escalaMax}
                              onChange={(e) =>
                                actualizarPregunta(
                                  preguntaIndex,
                                  "escalaMax",
                                  parseInt(e.target.value)
                                )
                              }
                              min="1"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  Crear Encuesta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de resultados */}
      {viewResults && resultados && (
        <div className="modal-overlay" onClick={() => setViewResults(null)}>
          <div
            className="modal-content modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>📊 Resultados: {resultados.encuesta.titulo}</h2>
              <button className="modal-close" onClick={() => setViewResults(null)}>
                ✕
              </button>
            </div>

            <div className="resultados-content">
              <div className="resultados-summary">
                <h3>Resumen</h3>
                <p>
                  <strong>Total de respuestas:</strong>{" "}
                  {resultados.encuesta.totalRespuestas}
                </p>
                {resultados.encuesta.descripcion && (
                  <p>{resultados.encuesta.descripcion}</p>
                )}
              </div>

              {resultados.resultados.map((resultado: any, index: number) => (
                <div key={index} className="resultado-pregunta">
                  <h4>
                    {index + 1}. {resultado.pregunta}
                  </h4>

                  {resultado.tipo === "opcion_multiple" && (
                    <div className="resultado-opciones">
                      {Object.entries(resultado.resumen).map(([opcion, cantidad]: any) => (
                        <div key={opcion} className="resultado-opcion">
                          <span className="opcion-texto">{opcion}</span>
                          <div className="opcion-barra">
                            <div
                              className="opcion-progreso"
                              style={{
                                width: `${
                                  (cantidad / resultados.encuesta.totalRespuestas) * 100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="opcion-cantidad">
                            {cantidad} ({((cantidad / resultados.encuesta.totalRespuestas) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {resultado.tipo === "escala" && (
                    <div className="resultado-escala">
                      <p>
                        <strong>Promedio:</strong> {resultado.resumen.promedio} / {resultado.resumen.total} respuestas
                      </p>
                    </div>
                  )}

                  {resultado.tipo === "texto_libre" && (
                    <div className="resultado-texto-libre">
                      {resultado.resumen.length === 0 ? (
                        <p className="empty">No hay respuestas</p>
                      ) : (
                        resultado.resumen.map((respuesta: string, i: number) => (
                          <div key={i} className="respuesta-libre">
                            <p>"{respuesta}"</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={() => exportarResultados(viewResults)}
              >
                Exportar a CSV
              </button>
              <button className="btn-cancel" onClick={() => setViewResults(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}