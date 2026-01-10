import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";

// Admin Imports
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import InventoryPage from "./pages/admin/InventoryPage"; // <--- IMPORT NUEVO

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />

          {/* 🔐 Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="inventory" element={<InventoryPage />} />{" "}
            {/* <--- RUTA CONECTADA */}
            {/* Placeholders */}
            <Route path="loans" element={<div>Préstamos (Pronto)</div>} />
            <Route path="users" element={<div>Usuarios (Pronto)</div>} />
          </Route>

          {/* 👤 User Routes */}
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
