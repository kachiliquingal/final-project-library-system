import { useState, useEffect } from "react";
import { supabase } from "../../api/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useRealtime } from "../../hooks/useRealtime";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { exportToPDF } from "../../utils/reportGenerator";
import {
  Clock,
  Calendar,
  BookOpen,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

export default function UserLoans() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("active");

  // PAGINATION
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  const queryClient = useQueryClient();

  // 1. USEQUERY
  const {
    data: loans = [],
    isLoading: loading,
    isError,
    error,
  } = useQuery({
    queryKey: ["my-loans", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("loans")
        .select(
          `
          id,
          loan_date,
          return_date,
          status,
          user_id, 
          books ( title, author, category, id )
        `,
        )
        .eq("user_id", user.id)
        .order("loan_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 0,
  });

  // 2. REALTIME
  useRealtime("loans", (payload) => {
    const changedUserId = payload.new?.user_id || payload.old?.user_id;
    if (changedUserId === user?.id) {
      queryClient.invalidateQueries({ queryKey: ["my-loans", user.id] });
    }
  });

  // 3. RESET PAGINATION ON TAB CHANGE
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const formatDate = (dateString) => {
    if (!dateString) return "Pendiente";
    return new Date(dateString).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // --- FILTERING AND PAGINATION LOGIC ---

  // 1. Separate lists
  const activeLoans = loans.filter((loan) => loan.status === "ACTIVO");
  const historyLoans = loans.filter((loan) => loan.status !== "ACTIVO");

  // 2. Determine current list
  const currentList = activeTab === "active" ? activeLoans : historyLoans;

  // 3. Calculate pagination on the current list
  const totalItems = currentList.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const displayLoans = currentList.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  // 4. EXPORT REPORT (Student)
  const handleExport = () => {
    if (currentList.length === 0) {
      alert("No hay datos para exportar en esta sección.");
      return;
    }

    const title =
      activeTab === "active"
        ? "Reporte de Préstamos Activos"
        : "Historial de Libros Devueltos";

    const columns = [
      { header: "Libro", accessor: "book_title" },
      { header: "Autor", accessor: "book_author" },
      { header: "Fecha Préstamo", accessor: "loan_date" },
      { header: "Estado", accessor: "status_text" },
    ];

    // If it's history, add return date
    if (activeTab === "history") {
      columns.splice(3, 0, {
        header: "Fecha Devolución",
        accessor: "return_date",
      });
    }

    const dataToExport = currentList.map((loan) => ({
      book_title: loan.books?.title || "Desconocido",
      book_author: loan.books?.author || "-",
      loan_date: new Date(loan.loan_date).toLocaleDateString("es-EC"),
      return_date: loan.return_date
        ? new Date(loan.return_date).toLocaleDateString("es-EC")
        : "-",
      status_text: loan.status === "ACTIVO" ? "En Curso" : "Devuelto",
    }));

    exportToPDF(dataToExport, title, columns);
  };

  return (
    <div className="space-y-8 w-full">
      {/* PROFILE HEADER */}
      <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white/20">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>

        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl font-bold">{user?.name}</h2>
          <p className="text-blue-200 text-sm">{user?.email}</p>

          <div className="flex gap-4 mt-4 justify-center md:justify-start">
            <div className="bg-white/10 px-4 py-2 rounded-lg text-sm backdrop-blur-sm border border-white/10">
              <span className="font-bold text-white text-lg mr-2">
                {activeLoans.length}
              </span>
              <span className="text-blue-200">Préstamos Activos</span>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-lg text-sm backdrop-blur-sm border border-white/10">
              <span className="font-bold text-white text-lg mr-2">
                {historyLoans.length}
              </span>
              <span className="text-blue-200">Devueltos</span>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION AND EXPORT TABS */}
      <div className="flex flex-col sm:flex-row justify-between items-end border-b border-gray-200 gap-4">
        <div className="flex w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("active")}
            className={`pb-4 px-6 text-sm font-medium transition-all relative ${
              activeTab === "active"
                ? "text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Préstamos Activos
            {activeTab === "active" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-4 px-6 text-sm font-medium transition-all relative ${
              activeTab === "history"
                ? "text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Historial de Devoluciones
            {activeTab === "history" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>
            )}
          </button>
        </div>

        {currentList.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary mb-3 px-2 transition-colors"
            title="Descargar comprobante en PDF"
          >
            <Download className="w-4 h-4" />
            <span className="font-medium">Descargar Reporte</span>
          </button>
        )}
      </div>

      {/* LOANS LIST */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : isError ? (
        <div className="text-center py-10 text-red-500 font-medium">
          Error al cargar tus datos. Por favor recarga la página.
        </div>
      ) : displayLoans.length > 0 ? (
        <>
          <div className="grid gap-4">
            {displayLoans.map((loan) => (
              <div
                key={loan.id}
                className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-xl ${
                      loan.status === "ACTIVO"
                        ? "bg-orange-50 text-orange-600"
                        : "bg-green-50 text-green-600"
                    }`}
                  >
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {loan.books?.title || "Libro no encontrado"}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {loan.books?.author} • {loan.books?.category}
                    </p>

                    <div className="flex flex-wrap gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        <Calendar className="w-3.5 h-3.5" />
                        Prestado: {formatDate(loan.loan_date)}
                      </div>

                      {loan.return_date && (
                        <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Devuelto: {formatDate(loan.return_date)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto text-right">
                  {loan.status === "ACTIVO" ? (
                    <div className="inline-flex flex-col items-end">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 mb-1">
                        <Clock className="w-3 h-3" /> EN CURSO
                      </span>
                      <span className="text-xs text-gray-400">
                        Debes devolverlo en biblioteca
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                      COMPLETADO
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t border-gray-100">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="text-sm font-medium text-gray-700">
                Página {page} de {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        // Empty State
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-gray-900 font-medium">
            No hay préstamos en esta sección
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            {activeTab === "active"
              ? "No tienes libros pendientes de devolución."
              : "Aún no has devuelto ningún libro."}
          </p>
        </div>
      )}
    </div>
  );
}
