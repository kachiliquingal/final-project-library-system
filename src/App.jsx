import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuthStore } from "./store/authStore";
import LoginPage from "./pages/LoginPage";

import ProtectedRoute from "./components/ProtectedRoute";

import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import InventoryPage from "./pages/admin/InventoryPage";
import UsersPage from "./pages/admin/UsersPage";
import LoansPage from "./pages/admin/LoansPage";

import UserLayout from "./components/user/UserLayout";
import UserCatalog from "./pages/user/UserCatalog";
import UserLoans from "./pages/user/UserLoans";

function App() {
  // Extract the Store initializer
  const initializeAuthListener = useAuthStore(
    (state) => state.initializeAuthListener,
  );

  // Run the initializer only once when the App loads
  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initializeAuthListener]);

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Path: Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />

          {/* 🔴 ADMIN ZONE (Only 'admin' role) */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route
                index
                element={<Navigate to="/admin/dashboard" replace />}
              />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="loans" element={<LoansPage />} />
              <Route path="users" element={<UsersPage />} />
            </Route>
          </Route>

          {/* 🟢 USER/STUDENT ZONE (Only 'user' role) */}
          <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
            <Route path="/user" element={<UserLayout />}>
              <Route index element={<Navigate to="/user/catalog" replace />} />
              <Route path="catalog" element={<UserCatalog />} />
              <Route path="my-loans" element={<UserLoans />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
