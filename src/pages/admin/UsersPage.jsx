import { useEffect, useState } from "react";
import { supabase } from "../../api/supabaseClient";
import { Search, Mail, Shield, User, Calendar } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(
          `full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. ENCABEZADO Y BUSCADOR */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Directorio de Usuarios
        </h2>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* 2. TABLA DE USUARIOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Fecha Registro</th>
                <th className="px-6 py-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Cargando usuarios...
                    </div>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar con iniciales si no hay imagen */}
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm overflow-hidden">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            user.full_name?.charAt(0).toUpperCase() || "U"
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {user.full_name || "Sin Nombre"}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          user.role === "admin"
                            ? "bg-purple-50 text-purple-700 border-purple-100"
                            : "bg-blue-50 text-blue-700 border-blue-100"
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {user.role === "admin" ? "Administrador" : "Estudiante"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Activo
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-10 text-center text-gray-400 italic"
                  >
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer simple con conteo */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 text-right">
          Total de usuarios registrados: {users.length}
        </div>
      </div>
    </div>
  );
}
