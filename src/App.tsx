import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import DashboardAdmin from "./pages/DashboardAdmin";
import DashboardUsuario from "./pages/DashboardUsuario";
import Usuarios from "./pages/admin/Usuarios";
import Anuncios from "./pages/admin/Anuncios";
import Reservaciones from "./pages/admin/Reservaciones";
import Pagos from "./pages/admin/Pagos";
import Visitantes from "./pages/admin/Visitantes";
import Encuestas from "./pages/admin/Encuestas"; 
import Chat from "./pages/Chat";
import EncuestasUsuario from "./pages/EncuestasUsuario"; 
import ProtectedRoute from "./routes/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard para USUARIOS */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardUsuario />
            </ProtectedRoute>
          }
        />

        {/* Rutas para USUARIOS NORMALES */}
        <Route
          path="/anuncios"
          element={
            <ProtectedRoute>
              <Anuncios />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reservaciones"
          element={
            <ProtectedRoute>
              <Reservaciones />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pagos"
          element={
            <ProtectedRoute>
              <Pagos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/visitantes"
          element={
            <ProtectedRoute>
              <Visitantes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* ← NUEVA RUTA PARA ENCUESTAS USUARIO */}
        <Route
          path="/encuestas"
          element={
            <ProtectedRoute>
              <EncuestasUsuario />
            </ProtectedRoute>
          }
        />

        {/* Dashboard para ADMIN */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requireAdmin>
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />

        {/* Rutas para ADMIN */}
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute requireAdmin>
              <Usuarios />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/anuncios"
          element={
            <ProtectedRoute requireAdmin>
              <Anuncios />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reservaciones"
          element={
            <ProtectedRoute requireAdmin>
              <Reservaciones />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/pagos"
          element={
            <ProtectedRoute requireAdmin>
              <Pagos />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/visitantes"
          element={
            <ProtectedRoute requireAdmin>
              <Visitantes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/chat"
          element={
            <ProtectedRoute requireAdmin>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* ← NUEVA RUTA PARA ENCUESTAS ADMIN */}
        <Route
          path="/admin/encuestas"
          element={
            <ProtectedRoute requireAdmin>
              <Encuestas />
            </ProtectedRoute>
          }
        />

        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;