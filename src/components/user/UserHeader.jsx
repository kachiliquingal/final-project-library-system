import { useAuth } from "../../context/AuthContext";
import { LogOut, User, Book } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UserHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="bg-white h-16 px-6 flex items-center justify-between shadow-sm sticky top-0 z-40">
      {/* Logo e Identidad */}
      <div className="flex items-center gap-3">
        <div className="bg-primary p-2 rounded-lg">
          <Book className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-gray-800 leading-none">
            Biblioteca
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">
            Facultad de Ingeniería
          </p>
        </div>
      </div>

      {/* Perfil y Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pr-4 border-r border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-700">
              {user?.name || "Estudiante"}
            </p>
            <p className="text-xs text-gray-500">Estudiante</p>
          </div>
          <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold border border-blue-100">
            {user?.name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-red-600 transition-colors p-2"
          title="Cerrar Sesión"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}