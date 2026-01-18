import { useState, useEffect } from "react";
import { supabase } from "../../api/supabaseClient";
import { useRealtime } from "../../hooks/useRealtime";
import { useDebounce } from "../../hooks/useDebounce";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Mail,
  Shield,
  User,
  Calendar,
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  // 🟢 2. Create debounced value (500ms)
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [imageErrors, setImageErrors] = useState({});
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const queryClient = useQueryClient();

  // 1. QUERY: Server-Side Pagination & Search (with Debounce)
  const {
    data: queryResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    // 🟢 3. Use debouncedSearchTerm in queryKey
    queryKey: ["profiles", page, debouncedSearchTerm],
    queryFn: async () => {
      // Base query including active loans count
      let query = supabase
        .from("profiles")
        .select(
          `
          *,
          loans (
            id,
            status
          )
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false });

      // 🟢 4. Use debouncedSearchTerm for Server-Side Search
      if (debouncedSearchTerm) {
        query = query.or(
          `full_name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%`,
        );
      }

      // Server-Side Pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;
      return { data, count };
    },
    staleTime: 0, // Always fetch fresh data
    keepPreviousData: true, // Smooth transition between pages
  });

  const users = queryResponse?.data || [];
  const totalItems = queryResponse?.count || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

  // Reset page when searching
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  // 2. REALTIME LISTENERS
  // Listen for new profiles
  useRealtime("profiles", () => {
    queryClient.invalidateQueries({ queryKey: ["profiles"] });
  });

  // Listen for loan changes (to update active loans count instantly)
  useRealtime("loans", () => {
    queryClient.invalidateQueries({ queryKey: ["profiles"] });
  });

  // --- HELPERS ---
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleImageError = (userId) => {
    setImageErrors((prev) => ({ ...prev, [userId]: true }));
  };

  // Helper to count active loans
  const getActiveLoansCount = (user) => {
    if (!user.loans) return 0;
    return user.loans.filter((l) => l.status === "ACTIVO").length;
  };

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <h3 className="font-bold">Error cargando usuarios</h3>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
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
            value={searchTerm} // Input remains responsive
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* 2. TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4 text-center">Préstamos Activos</th>
                <th className="px-6 py-4">Fecha Registro</th>
                <th className="px-6 py-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Cargando usuarios...
                    </div>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user) => {
                  const activeLoans = getActiveLoansCount(user);
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm overflow-hidden shrink-0 border border-primary/20">
                            {user.avatar_url && !imageErrors[user.id] ? (
                              <img
                                src={user.avatar_url}
                                alt="avatar"
                                className="w-full h-full object-cover"
                                onError={() => handleImageError(user.id)}
                                referrerPolicy="no-referrer"
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
                          {user.role === "admin"
                            ? "Administrador"
                            : "Estudiante"}
                        </div>
                      </td>

                      {/* Active Loans Count */}
                      <td className="px-6 py-4 text-center">
                        {user.role === "admin" ? (
                          <span className="text-gray-300">-</span>
                        ) : activeLoans > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                            <BookOpen className="w-3 h-3" /> {activeLoans}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Sin libros
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(user.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          Activo
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-gray-400 italic"
                  >
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {users.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              Mostrando {users.length} de {totalItems} usuarios
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm font-medium text-gray-700">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
