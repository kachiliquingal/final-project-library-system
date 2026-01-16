import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

export default function AdminLayout() {
  const location = useLocation();

  // Determinar título según la ruta (simple switch)
  const getTitle = () => {
    switch (location.pathname) {
      case "/admin/inventory":
        return "Gestión de Inventario";
      case "/admin/users":
        return "Gestión de Usuarios";
      case "/admin/loans":
        return "Gestión de Préstamos";
      case "/admin/settings":
        return "Configuración";
      default:
        return "Panel de Control";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* 1. Sidebar Fijo */}
      <AdminSidebar />

      {/* 2. Área de Contenido Principal (con margen a la izquierda para no tapar el sidebar) */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen transition-all">
        <AdminHeader title={getTitle()} />

        {/* 3. Aquí se inyectan las páginas */}
        <div className="p-8 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
