import { useState } from "react";
import { supabase } from "../../api/supabaseClient";
import { useRealtime } from "../../hooks/useRealtime";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"; // <--- 1. NUEVOS IMPORTS
import {
  Search,
  BookOpen,
  User,
  CheckCircle,
  Clock,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

export default function LoansPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL, ACTIVO, DEVUELTO

  // Acceso al cliente para invalidar caché
  const queryClient = useQueryClient();

  // 🔴 2. USEQUERY: Carga de datos inteligente
  const {
    data: loans = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["loans", filter], // Si cambia el filtro, TanStack busca nuevos datos
    queryFn: async () => {
      console.log("📡 Buscando préstamos en Supabase...");
      let query = supabase
        .from("loans")
        .select(
          `
          id,
          loan_date,
          return_date,
          status,
          books ( title, author, category ),
          profiles ( full_name, email )
        `
        )
        .order("loan_date", { ascending: false });

      if (filter !== "ALL") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60, // Datos frescos por 1 minuto
  });

  // 🔴 3. USEMUTATION: Para manejar la devolución (Optimistic Update)
  // Esto es un extra genial: Si devuelves un libro sin internet, TanStack lo intentará después.
  const returnMutation = useMutation({
    mutationFn: async (loanId) => {
      const { error } = await supabase
        .from("loans")
        .update({
          status: "DEVUELTO",
          return_date: new Date().toISOString(),
        })
        .eq("id", loanId);

      if (error) throw error;
    },
    // Cuando termine con éxito, invalidamos para refrescar la lista
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      // Aquí también invalidamos 'books' (Inventario) porque el libro ahora está disponible
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });

  // 🔴 4. REALTIME: Sigue vivo y coleando
  useRealtime("loans", () => {
    console.log(
      "⚡ Cambio en Loans detectado por Realtime -> Invalidando caché"
    );
    queryClient.invalidateQueries({ queryKey: ["loans"] });
  });

  const handleReturnBook = async (loanId) => {
    if (!window.confirm("¿Confirmar la devolución de este libro?")) return;
    returnMutation.mutate(loanId);
  };

  // Filtrado local para el buscador (Frontend)
  const filteredLoans = loans.filter((loan) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const bookTitle = loan.books?.title?.toLowerCase() || "";
    const userName = loan.profiles?.full_name?.toLowerCase() || "";
    return bookTitle.includes(searchLower) || userName.includes(searchLower);
  });

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <h3 className="font-bold">Error cargando préstamos</h3>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Historial de Préstamos
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVO">Activos (Pendientes)</option>
            <option value="DEVUELTO">Devueltos</option>
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar libro o estudiante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Libro</th>
                <th className="px-6 py-4">Estudiante</th>
                <th className="px-6 py-4">Fecha Préstamo</th>
                <th className="px-6 py-4">Fecha Devolución</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Cargando historial...
                    </div>
                  </td>
                </tr>
              ) : filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => (
                  <tr
                    key={loan.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <p
                            className="font-medium text-gray-800 text-sm max-w-[200px] truncate"
                            title={loan.books?.title}
                          >
                            {loan.books?.title || "Libro eliminado"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {loan.books?.category || "General"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {loan.profiles?.full_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {loan.profiles?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(loan.loan_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {loan.return_date ? formatDate(loan.return_date) : "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          loan.status === "ACTIVO"
                            ? "bg-purple-50 text-purple-700 border-purple-100"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {loan.status === "ACTIVO" ? "En Curso" : "Devuelto"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {loan.status === "ACTIVO" && (
                        <button
                          onClick={() => handleReturnBook(loan.id)}
                          disabled={returnMutation.isLoading} // Bloqueamos si se está procesando
                          className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1 rounded-md transition-colors shadow-sm flex items-center gap-1 ml-auto disabled:opacity-50"
                        >
                          {returnMutation.isLoading ? (
                            <div className="animate-spin h-3 w-3 border-b-2 border-gray-600 rounded-full"></div>
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          Devolver
                        </button>
                      )}
                      {loan.status === "DEVUELTO" && (
                        <span className="text-xs text-green-600 flex items-center justify-end gap-1">
                          <CheckCircle className="w-3 h-3" /> Completado
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center text-gray-400 italic"
                  >
                    No hay registros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
