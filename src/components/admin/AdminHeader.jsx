import { useAuth } from "../../context/AuthContext";
import { Bell, Search } from "lucide-react";

export default function AdminHeader({ title }) {
  const { user } = useAuth();

  return (
    <header className="bg-white h-20 px-8 flex items-center justify-between shadow-sm sticky top-0 z-40">
      {/* Título de la página actual */}
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>

      <div className="flex items-center gap-6">
        {/* Barra de búsqueda rápida */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
          />
        </div>

        {/* Notificaciones y Perfil */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-700">
                {user?.name || "Administrador"}
              </p>
              <p className="text-xs text-gray-500 uppercase">
                {user?.role || "Admin"}
              </p>
            </div>
            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
