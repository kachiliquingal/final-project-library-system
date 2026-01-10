import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";

// Importar Layouts y Páginas de Admin
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Ruta Pública */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />

          {/* 🔐 RUTAS PROTEGIDAS DE ADMIN */}
          <Route path="/admin" element={<AdminLayout />}>
            {/* Cuando entras a /admin, te redirige a dashboard */}
            <Route index element={<Navigate to="/admin/dashboard" replace />} />

            {/* Páginas internas del admin */}
            <Route path="dashboard" element={<AdminDashboard />} />

            {/* Placeholders para las otras opciones del menú */}
            <Route path="inventory" element={<div>Inventario (Pronto)</div>} />
            <Route
              path="users"
              element={<div>Gestión de Usuarios (Pronto)</div>}
            />
            <Route
              path="settings"
              element={<div>Configuración (Pronto)</div>}
            />
          </Route>

          {/* 👤 RUTAS DE USUARIO (Pendiente) */}
          <Route
            path="/user/catalog"
            element={<div>Catálogo de Usuario</div>}
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
