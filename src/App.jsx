import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";

// Importamos el componente de seguridad
import ProtectedRoute from "./components/ProtectedRoute";

import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import InventoryPage from "./pages/admin/InventoryPage";
import UsersPage from "./pages/admin/UsersPage";
import LoansPage from "./pages/admin/LoansPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Ruta Pública: Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />

          {/* 🔴 ZONA DE ADMINISTRADOR (Solo rol 'admin') */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="loans" element={<LoansPage />} />
              <Route path="users" element={<UsersPage />} />
              {/* Cualquier otra ruta admin va aquí */}
            </Route>
          </Route>

          {/* 🟢 ZONA DE USUARIO/ESTUDIANTE (Solo rol 'user') */}
          <Route element={<ProtectedRoute allowedRoles={['user']} />}>
            <Route
              path="/user/catalog"
              element={
                // Aquí deberías poner tu Layout de usuario o la página del catálogo real
                // Por ahora dejo un div simple como marcador
                <div className="p-10">
                  <h1 className="text-2xl font-bold">Catálogo de Libros</h1>
                  <p>Bienvenido, estudiante. Aquí podrás ver los libros disponibles.</p>
                </div>
              }
            />
          </Route>

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;