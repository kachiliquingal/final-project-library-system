import { NavLink } from "react-router-dom";
import { LayoutDashboard, Book, Users, Settings, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AdminSidebar() {
  const { logout } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Book, label: "Inventario", path: "/admin/inventory" },
    { icon: Users, label: "Usuarios", path: "/admin/users" },
    { icon: Settings, label: "Configuración", path: "/admin/settings" },
  ];

  return (
    <aside className="w-64 bg-primary text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-50 transition-all">
      {/* Logo Area */}
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="bg-white p-2 rounded-lg">
          <Book className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-lg leading-tight">AdminPanel</h2>
          <p className="text-xs text-blue-200">Library System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-white text-primary font-bold shadow-lg"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-200 hover:bg-red-500/20 hover:text-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
