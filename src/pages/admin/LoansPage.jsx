import { useState, useEffect } from "react";
import { supabase } from "../../api/supabaseClient";
import { useRealtime } from "../../hooks/useRealtime";
import { useDebounce } from "../../hooks/useDebounce";
import { exportToCSV, exportToPDF } from "../../utils/reportGenerator";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { sendEmailNotification } from "../../api/emailService";
import { AlertCircle } from "lucide-react";

import LoanFilters from "../../components/admin/loans/LoanFilters";
import LoansTable from "../../components/admin/loans/LoansTable";
import ReturnLoanModal from "../../components/admin/loans/ReturnLoanModal";
import SuccessModal from "../../components/common/SuccessModal";

export default function LoansPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("desc");
  const [showExportMenu, setShowExportMenu] = useState(false);

  const ITEMS_PER_PAGE = 8;
  const queryClient = useQueryClient();

  // MODAL STATES
  const [loanToReturn, setLoanToReturn] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // 1. DATA QUERY
  const {
    data: queryResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["loans", page, filter, sortOrder, debouncedSearchTerm],
    queryFn: async () => {
      let query = supabase.from("loans").select(
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
        { count: "exact" },
      );

      if (filter !== "ALL") {
        query = query.eq("status", filter);
      }

      query = query.order("loan_date", { ascending: sortOrder === "asc" });

      if (!debouncedSearchTerm) {
        const from = (page - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        query = query.range(from, to);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      return { data, count };
    },
    keepPreviousData: true,
    staleTime: 0,
  });

  const rawLoans = queryResponse?.data || [];
  const serverCount = queryResponse?.count || 0;

  let displayLoans = [];
  let totalItems = 0;

  if (debouncedSearchTerm) {
    const searchLower = debouncedSearchTerm.toLowerCase();
    const filtered = rawLoans.filter((loan) => {
      const bookTitle = loan.books?.title?.toLowerCase() || "";
      const userName = loan.profiles?.full_name?.toLowerCase() || "";
      const loanId = loan.id.toString();
      return (
        bookTitle.includes(searchLower) ||
        userName.includes(searchLower) ||
        loanId.includes(searchLower)
      );
    });

    totalItems = filtered.length;
    displayLoans = filtered.slice(
      (page - 1) * ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE,
    );
  } else {
    displayLoans = rawLoans;
    totalItems = serverCount;
  }

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearchTerm, sortOrder]);

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  // EXPORT FUNCTION
  const handleExport = async (type) => {
    setShowExportMenu(false);
    const columns = [
      { header: "ID", accessor: "id" },
      { header: "Libro", accessor: "book_title" },
      { header: "Estudiante", accessor: "student_name" },
      { header: "Correo", accessor: "student_email" },
      { header: "Fecha Préstamo", accessor: "loan_date" },
      { header: "Fecha Devolución", accessor: "return_date" },
      { header: "Estado", accessor: "status" },
    ];

    try {
      let query = supabase.from("loans").select(`
          id,
          loan_date,
          return_date,
          status,
          books ( title ),
          profiles ( full_name, email )
      `);

      if (filter !== "ALL") {
        query = query.eq("status", filter);
      }

      query = query.order("loan_date", { ascending: sortOrder === "asc" });

      const { data, error } = await query;
      if (error) throw error;

      let processedData = data.map((loan) => ({
        id: loan.id,
        book_title: loan.books?.title || "Desconocido",
        student_name: loan.profiles?.full_name || "Desconocido",
        student_email: loan.profiles?.email || "-",
        loan_date: new Date(loan.loan_date).toLocaleDateString("es-EC"),
        return_date: loan.return_date
          ? new Date(loan.return_date).toLocaleDateString("es-EC")
          : "Pendiente",
        status: loan.status,
      }));

      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        processedData = processedData.filter(
          (item) =>
            item.book_title.toLowerCase().includes(searchLower) ||
            item.student_name.toLowerCase().includes(searchLower) ||
            item.id.toString().includes(searchLower),
        );
      }

      if (type === "csv") {
        exportToCSV(processedData, "Reporte_Prestamos", columns);
      } else {
        exportToPDF(
          processedData,
          "Reporte Historial de Préstamos",
          columns,
          "landscape",
        );
      }
    } catch (err) {
      alert("Error al exportar: " + err.message);
    }
  };

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

      await supabase.from("notifications").insert([
        {
          type: "RETURN",
          message: `Devolución #${loan.id}: Libro "${bookTitle}" retornado por ${studentName}.`,
          user_id: loan.user_id,
        },
      ]);

      sendEmailNotification({
        name: studentName,
        subject: `Constancia de Devolución #${loan.id}`,
        message: `Devolución exitosa del libro "${bookTitle}". Ticket cerrado: #${loan.id}.`,
        target: "student",
      });

      sendEmailNotification({
        name: "Administrador",
        subject: `✅ Devolución #${loan.id} Procesada`,
        message: `Devolución procesada: "${bookTitle}" por ${studentName}.`,
        target: "admin",
      });

      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });

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
      <LoanFilters
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        filter={filter}
        onFilterChange={(e) => setFilter(e.target.value)}
        showExportMenu={showExportMenu}
        setShowExportMenu={setShowExportMenu}
        onExport={handleExport}
      />

      <LoansTable
        isLoading={isLoading}
        loans={displayLoans}
        totalItems={totalItems}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        sortOrder={sortOrder}
        onToggleSort={toggleSort}
        onReturnClick={setLoanToReturn}
        isReturnLoading={returnMutation.isLoading}
      />

      <ReturnLoanModal
        isOpen={!!loanToReturn}
        onClose={() => setLoanToReturn(null)}
        onConfirm={() => loanToReturn && returnMutation.mutate(loanToReturn)}
        loan={loanToReturn}
        isLoading={returnMutation.isLoading}
      />

      <SuccessModal
        isOpen={!!successMessage}
        message={successMessage}
        onClose={() => setSuccessMessage(null)}
      />
    </div>
  );
}
