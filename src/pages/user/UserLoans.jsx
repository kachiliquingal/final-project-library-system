import { useState, useEffect } from "react";
import { supabase } from "../../api/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useRealtime } from "../../hooks/useRealtime";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { exportToPDF } from "../../utils/reportGenerator";

import LoansProfileHeader from "../../components/user/loans/LoansProfileHeader";
import LoansTabs from "../../components/user/loans/LoansTabs";
import LoansList from "../../components/user/loans/LoansList";

export default function UserLoans() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("active");

  // PAGINATION
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  const queryClient = useQueryClient();

  // USEQUERY
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

  // REALTIME
  useRealtime("loans", (payload) => {
    const changedUserId = payload.new?.user_id || payload.old?.user_id;
    if (changedUserId === user?.id) {
      queryClient.invalidateQueries({ queryKey: ["my-loans", user.id] });
    }
  });

  // RESET PAGINATION ON TAB CHANGE
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

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

  if (isError) {
    return (
      <div className="text-center py-10 text-red-500 font-medium">
        Error al cargar tus datos: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">
      <LoansProfileHeader
        user={user}
        activeCount={activeLoans.length}
        historyCount={historyLoans.length}
      />

      <LoansTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showExportButton={currentList.length > 0}
        onExport={handleExport}
      />

      <LoansList
        isLoading={loading}
        loans={displayLoans}
        activeTab={activeTab}
        totalPages={totalPages}
        page={page}
        onPageChange={setPage}
        totalItems={totalItems}
      />
    </div>
  );
}
