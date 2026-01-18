import { useState, useEffect } from "react";
import { supabase } from "../../api/supabaseClient";
import { useRealtime } from "../../hooks/useRealtime";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { sendEmailNotification } from "../../api/emailService";
import {
  Search,
  BookOpen,
  User,
  CheckCircle,
  Clock,
  RotateCcw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Hash, // 🟢 Icono para el ID
} from "lucide-react";

export default function LoansPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("desc");

  const ITEMS_PER_PAGE = 8;
  const queryClient = useQueryClient();

  // --- ESTADOS PARA MODALES ---
  const [loanToReturn, setLoanToReturn] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // 1. QUERY DE DATOS
  const {
    data: loans = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["loans", filter],
    queryFn: async () => {
      let query = supabase
        .from("loans")
        .select(
          `
          id,
          loan_date,
          return_date,
          status,
          book_id,
          user_id, 
          books ( title, author, category ),
          profiles ( full_name, email )
        `,
        )
        .order("loan_date", { ascending: false });

      if (filter !== "ALL") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 0,
  });

  useEffect(() => {
    setPage(1);
  }, [filter, searchTerm, sortOrder]);

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  // 2. MUTATION: DEVOLVER LIBRO
  const returnMutation = useMutation({
    mutationFn: async (loan) => {
      const { error: loanError } = await supabase
        .from("loans")
        .update({
          status: "DEVUELTO",
          return_date: new Date().toISOString(),
        })
        .eq("id", loan.id);

      if (loanError) throw loanError;

      const { error: bookError } = await supabase
        .from("books")
        .update({ status: "DISPONIBLE" })
        .eq("id", loan.book_id);

      if (bookError) throw bookError;
    },
    onSuccess: async (data, loan) => {
      const studentName = loan.profiles?.full_name || "Estudiante";
      const bookTitle = loan.books?.title || "Libro";

      // 1. Notificación BD (Con ID de Trazabilidad)
      await supabase.from("notifications").insert([
        {
          type: "RETURN",
          message: `Devolución #${loan.id}: El libro "${bookTitle}" ha sido retornado al inventario por ${studentName}.`,
          user_id: loan.user_id,
        },
      ]);

      // 2. CORREO ESTUDIANTE (Con ID de Trazabilidad)
      await sendEmailNotification({
        name: studentName,
        subject: `Constancia de Devolución #${loan.id} - Biblioteca UCE`,
        message: `Se confirma la devolución exitosa del libro "${bookTitle}".
        
        ------------------------------------------
        ✅ TICKET CERRADO: #${loan.id}
        ------------------------------------------
        Gracias por devolver el material a tiempo.`,
        target: "student",
      });

      // 3. CORREO ADMIN (Con ID de Trazabilidad)
      await sendEmailNotification({
        name: "Administrador",
        subject: `✅ Devolución #${loan.id} Procesada (Sistema)`,
        message: `Has procesado exitosamente la devolución del libro "${bookTitle}" devuelto por ${studentName}.
        
        Código de Trazabilidad: #${loan.id}`,
        target: "admin",
      });

      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });

      // Cerrar confirmación y mostrar éxito
      setLoanToReturn(null);
      setSuccessMessage(
        `Préstamo #${loan.id} finalizado correctamente. Constancias enviadas.`,
      );
    },
    onError: (err) => {
      alert("Error al devolver el libro: " + err.message);
    },
  });

  useRealtime("loans", () => {
    queryClient.invalidateQueries({ queryKey: ["loans"] });
  });

  // --- HANDLERS ---
  const handleReturnClick = (loan) => {
    setLoanToReturn(loan);
  };

  const confirmReturn = () => {
    if (loanToReturn) {
      returnMutation.mutate(loanToReturn);
    }
  };

  // --- VISUALIZACIÓN ---
  const filteredLoans = loans.filter((loan) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const bookTitle = loan.books?.title?.toLowerCase() || "";
    const userName = loan.profiles?.full_name?.toLowerCase() || "";
    const loanId = loan.id.toString(); // Permitir búsqueda por ID
    return (
      bookTitle.includes(searchLower) ||
      userName.includes(searchLower) ||
      loanId.includes(searchLower)
    );
  });

  const sortedLoans = [...filteredLoans].sort((a, b) => {
    const dateA = new Date(a.loan_date);
    const dateB = new Date(b.loan_date);
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const totalItems = sortedLoans.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedLoans = sortedLoans.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

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
    <div className="space-y-6 relative">
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
              placeholder="Buscar por Libro, Estudiante o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                {/* 🟢 NUEVA COLUMNA ID */}
                <th className="px-6 py-4 w-16 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Hash className="w-3 h-3" /> ID
                  </div>
                </th>
                <th className="px-6 py-4 w-1/3">Libro</th>
                <th className="px-6 py-4">Estudiante</th>
                <th
                  className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group select-none"
                  onClick={toggleSort}
                  title="Clic para cambiar orden"
                >
                  <div className="flex items-center gap-1">
                    Fecha Préstamo
                    {sortOrder === "desc" ? (
                      <ArrowDown className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <ArrowUp className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-4">Fecha Devolución</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Cargando historial...
                    </div>
                  </td>
                </tr>
              ) : paginatedLoans.length > 0 ? (
                paginatedLoans.map((loan) => (
                  <tr
                    key={loan.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* 🟢 VISUALIZACIÓN DEL ID */}
                    <td className="px-6 py-4 text-xs font-mono font-bold text-gray-400 text-center">
                      #{loan.id}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-50 p-2 rounded-lg text-orange-600 mt-1 shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm leading-snug">
                            {loan.books?.title || "Libro eliminado"}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {loan.books?.author && (
                              <span className="font-medium">
                                {loan.books.author}
                              </span>
                            )}
                            {loan.books?.author &&
                              loan.books?.category &&
                              " • "}
                            {loan.books?.category || "General"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top pt-5">
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
                    <td className="px-6 py-4 text-sm text-gray-600 align-top pt-5">
                      {formatDate(loan.loan_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 align-top pt-5">
                      {loan.return_date ? formatDate(loan.return_date) : "-"}
                    </td>
                    <td className="px-6 py-4 text-center align-top pt-5">
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
                    <td className="px-6 py-4 text-right align-top pt-5">
                      {loan.status === "ACTIVO" && (
                        <button
                          onClick={() => handleReturnClick(loan)}
                          disabled={returnMutation.isLoading}
                          className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1 rounded-md transition-colors shadow-sm flex items-center gap-1 ml-auto disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" /> Devolver
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
                    colSpan="7"
                    className="px-6 py-10 text-center text-gray-400 italic"
                  >
                    No hay registros coinciden con tu búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        {paginatedLoans.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              Mostrando {paginatedLoans.length} de {totalItems} registros
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

      {/* --- MODALES --- */}

      {/* 1. MODAL CONFIRMACIÓN DEVOLUCIÓN */}
      {loanToReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              ¿Confirmar Devolución?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Estás a punto de cerrar el ticket{" "}
              <strong>#{loanToReturn.id}</strong>.<br />
              El libro <strong>"{loanToReturn.books?.title}"</strong> volverá al
              inventario.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setLoanToReturn(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReturn}
                disabled={returnMutation.isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
              >
                {returnMutation.isLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" /> Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL DE ÉXITO */}
      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              ¡Operación Exitosa!
            </h3>
            <p className="text-gray-500 text-sm mb-6">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}