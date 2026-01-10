import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";

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
          {/* Public Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />

          {/* 🔐 Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="loans" element={<LoansPage />} />{" "}
            <Route path="users" element={<UsersPage />} />
            <Route
              path="settings"
              element={<Navigate to="/admin/dashboard" />}
            />
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
