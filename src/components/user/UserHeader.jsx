import { useAuth } from "../../context/AuthContext";
import { LogOut, User, Book, Library } from "lucide-react"; // Agregamos Library
import { useNavigate, Link, useLocation } from "react-router-dom"; // Agregamos Link y useLocation

export default function UserHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Hook para saber la URL actual

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  // Función auxiliar para verificar si un link está activo
  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white h-16 px-6 flex items-center justify-between shadow-sm sticky top-0 z-40">
      
      {/* SECCIÓN IZQUIERDA: Logo + Navegación Desktop */}
      <div className="flex items-center gap-8">
        
        {/* 1. Logo e Identidad */}
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <Book className="w-5 h-5 text-white" />
          </div>
          <div className="hidden md:block"> {/* Ocultamos texto en móviles muy pequeños para dar espacio */}
            <h1 className="font-bold text-lg text-gray-800 leading-none">
              Biblioteca
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              Facultad de Ingeniería
            </p>
          </div>
        </div>

        {/* 2. NAVEGACIÓN PRINCIPAL (Solo visible en Desktop) */}
        <nav className="hidden md:flex items-center gap-1">
            <Link 
                to="/user/catalog" 
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/user/catalog') 
                    ? 'bg-gray-100 text-primary' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
            >
                Catálogo
            </Link>
            <Link 
                to="/user/my-loans" 
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/user/my-loans') 
                    ? 'bg-gray-100 text-primary' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
            >
                Mis Préstamos
            </Link>
        </nav>
      </div>

      {/* SECCIÓN DERECHA: Perfil y Logout */}
      <div className="flex items-center gap-4">
        
        {/* 3. NAVEGACIÓN MÓVIL (Solo iconos, visible en celular) */}
        <div className="flex md:hidden gap-4 mr-2 border-r border-gray-200 pr-4">
             <Link to="/user/catalog" className={isActive('/user/catalog') ? 'text-primary' : 'text-gray-400'}>
                <Book className="w-5 h-5" />
             </Link>
             <Link to="/user/my-loans" className={isActive('/user/my-loans') ? 'text-primary' : 'text-gray-400'}>
                <Library className="w-5 h-5" />
             </Link>
        </div>

        {/* 4. Datos del Usuario */}
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

        {/* 5. Botón Salir */}
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