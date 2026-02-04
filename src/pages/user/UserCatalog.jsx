import { useState } from "react";
import { supabase } from "../../api/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useRealtime } from "../../hooks/useRealtime";
import { useDebounce } from "../../hooks/useDebounce";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { sendEmailNotification } from "../../api/emailService";
import { AlertCircle } from "lucide-react";

import CatalogHeader from "../../components/user/catalog/CatalogHeader";
import TopBooksSection from "../../components/user/catalog/TopBooksSection";
import BookGrid from "../../components/user/catalog/BookGrid";
import { ConfirmLoanModal } from "../../components/user/catalog/LoanModals";
import SuccessModal from "../../components/common/SuccessModal";

export default function UserCatalog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const [bookToRequest, setBookToRequest] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // QUERY: Catalog
  const {
    data: queryData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["catalog", page, debouncedSearchTerm],
    queryFn: async () => {
      let query = supabase
        .from("books")
        .select("*", { count: "exact" })
        .eq("is_active", true);

      if (debouncedSearchTerm) {
        query = query.or(
          `title.ilike.%${debouncedSearchTerm}%,author.ilike.%${debouncedSearchTerm}%,category.ilike.%${debouncedSearchTerm}%`,
        );
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await query
        .order("title", { ascending: true })
        .range(from, to);

      if (error) throw error;
      return { data, count };
    },
    keepPreviousData: true,
    staleTime: 1000 * 60,
  });

  // QUERY: Top 5 Global
  const { data: topBooks = [] } = useQuery({
    queryKey: ["top-books"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_top_books");
      if (error) {
        console.error("Error fetching top books:", error);
        return [];
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const books = queryData?.data || [];
  const totalBooks = queryData?.count || 0;
  const totalPages = Math.ceil(totalBooks / ITEMS_PER_PAGE) || 1;

  // MUTATION: Request Loan
  const loanMutation = useMutation({
    mutationFn: async (book) => {
      const { data: updatedBook, error: updateError } = await supabase
        .from("books")
        .update({ status: "PRESTADO" })
        .eq("id", book.id)
        .eq("status", "DISPONIBLE")
        .select();

      if (updateError) throw updateError;
      if (!updatedBook || updatedBook.length === 0)
        throw new Error("ALREADY_TAKEN");

      const { data: newLoan, error: loanError } = await supabase
        .from("loans")
        .insert([
          {
            book_id: book.id,
            user_id: user.id,
            loan_date: new Date().toISOString(),
            status: "ACTIVO",
          },
        ])
        .select()
        .single();

      if (loanError) throw loanError;
      return newLoan;
    },
    onSuccess: async (newLoan, variables) => {
      setBookToRequest(null);
      setSuccessMessage(
        `¡Solicitud Exitosa! Tu código de transacción es #${newLoan.id}. Por favor acércate a la biblioteca.`,
      );

      const studentName = user.name || user.email;

      await supabase.from("notifications").insert([
        {
          type: "LOAN",
          message: `Préstamo #${newLoan.id}: Libro "${variables.title}" registrado.`,
          user_id: user.id,
        },
      ]);

      sendEmailNotification({
        name: studentName,
        subject: `Confirmación de Préstamo #${newLoan.id}`,
        message: `Has reservado el libro "${variables.title}". Código: #${newLoan.id}. Tienes 24h para retirarlo.`,
        target: "student",
      });

      sendEmailNotification({
        name: "Administrador",
        subject: `🔔 Nuevo Préstamo #${newLoan.id}`,
        message: `Estudiante ${studentName} solicitó "${variables.title}".`,
        target: "admin",
      });

      queryClient.invalidateQueries({
        queryKey: ["user-notifications", user.id],
      });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      queryClient.invalidateQueries({ queryKey: ["my-loans"] });
      queryClient.invalidateQueries({ queryKey: ["top-books"] });
    },
    onError: (err) => {
      setBookToRequest(null);
      if (err.message === "ALREADY_TAKEN") {
        alert("¡Ups! Alguien más ganó este libro hace un instante.");
        queryClient.invalidateQueries({ queryKey: ["catalog"] });
        queryClient.invalidateQueries({ queryKey: ["top-books"] });
      } else {
        alert("Error al procesar la solicitud.");
        console.error(err);
      }
    },
  });

  // REALTIME
  useRealtime("books", () => {
    queryClient.invalidateQueries({ queryKey: ["catalog"] });
    queryClient.invalidateQueries({ queryKey: ["top-books"] });
    queryClient.invalidateQueries({ queryKey: ["my-loans"] });
  });

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100 mt-10">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <h3 className="font-bold">Error cargando el catálogo</h3>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <CatalogHeader searchTerm={searchTerm} onSearchChange={handleSearch} />

      <div className="space-y-12">
        {!debouncedSearchTerm && (
          <TopBooksSection
            topBooks={topBooks}
            onRequestLoan={setBookToRequest}
          />
        )}

        <BookGrid
          isLoading={isLoading}
          books={books}
          totalBooks={totalBooks}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onRequestLoan={setBookToRequest}
          loadingLoanId={
            loanMutation.isLoading ? loanMutation.variables?.id : null
          }
        />
      </div>

      <ConfirmLoanModal
        book={bookToRequest}
        onConfirm={() => bookToRequest && loanMutation.mutate(bookToRequest)}
        onCancel={() => setBookToRequest(null)}
        isLoading={loanMutation.isLoading}
      />

      <SuccessModal
        isOpen={!!successMessage}
        message={successMessage}
        onClose={() => setSuccessMessage(null)}
      />
    </div>
  );
}
