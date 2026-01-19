import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

export default function AdminLayout() {
  const location = useLocation();

  // TITLE ACCORDING TO THE ROUTE
  const getTitle = () => {
    switch (location.pathname) {
      case "/admin/inventory":
        return "Gestión de Inventario";
      case "/admin/users":
        return "Gestión de Usuarios";
      case "/admin/loans":
        return "Gestión de Préstamos";
      default:
        return "Panel de Control";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* FIXED SIDEBAR */}
      <AdminSidebar />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen transition-all">
        <AdminHeader title={getTitle()} />

        {/* PAGES ARE INJECTED HERE */}
        <div className="p-8 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
