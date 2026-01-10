import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Book,
  Users,
  ClipboardList,
  LogOut,
} from "lucide-react"; // Importamos ClipboardList
import { useAuth } from "../../context/AuthContext";

export default function AdminSidebar() {
  const { logout } = useAuth();

  // MENÚ EXACTO COMO EL WIREFRAME
  const menuItems = [
    { icon: LayoutDashboard, label: "Inicio", path: "/admin/dashboard" },
    { icon: Book, label: "Inventario", path: "/admin/inventory" },
    { icon: ClipboardList, label: "Préstamos", path: "/admin/loans" }, // Reemplaza Configuración
    { icon: Users, label: "Usuarios", path: "/admin/users" },
  ];

  return (
    <aside className="w-64 bg-primary text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-50">
      {/* Logo Area */}
      <div className="p-8 flex items-center gap-3">
        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
          <Book className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-xl tracking-tight">Sistema</h2>
          <p className="text-xs text-blue-200 opacity-80">Bibliotecario</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-3 mt-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${
                isActive
                  ? "bg-white text-primary shadow-lg translate-x-2"
                  : "text-blue-100 hover:bg-white/10 hover:translate-x-1"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10 mb-2 mx-4">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-200 hover:bg-red-500/20 hover:text-white transition-all group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
