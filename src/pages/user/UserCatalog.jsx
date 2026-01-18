import { useState } from "react";
import { supabase } from "../../api/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useRealtime } from "../../hooks/useRealtime";
import { useDebounce } from "../../hooks/useDebounce";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { sendEmailNotification } from "../../api/emailService";
import {
  Search,
  BookOpen,
  Clock,
  CheckCircle,
  TrendingUp,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

const getCategoryCoverImage = (category) => {
  const normalized = category?.toLowerCase().trim() || "";

  if (normalized.includes("matemática"))
    return "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=500&q=80";

  if (normalized.includes("fisica") || normalized.includes("física"))
    return "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=500&q=80";

  if (normalized.includes("quimica") || normalized.includes("química"))
    return "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=400&q=80";

  if (normalized.includes("redes"))
    return "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=500&q=80";

  if (
    normalized.includes("programacion") ||
    normalized.includes("programación")
  )
    return "https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=500&q=80";

  if (normalized.includes("sistemas"))
    return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80";

  if (normalized.includes("estadistica") || normalized.includes("estadística"))
    return "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80";

  if (normalized.includes("gestion") || normalized.includes("gestión"))
    return "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=500&q=80";

  return "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=500&q=80";
};

export default function UserCatalog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // MODALES
  const [bookToRequest, setBookToRequest] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // 1. QUERY: Catálogo
  const {
    data: queryData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["catalog", page, debouncedSearchTerm],
    queryFn: async () => {
      let query = supabase.from("books").select("*", { count: "exact" });

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

  // 2. QUERY: Top 5 Global
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

  // 3. MUTATION: Solicitar Préstamo
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
          message: `Préstamo #${newLoan.id}: Se ha registrado el libro "${variables.title}" a nombre de ${studentName}.`,
          user_id: user.id,
        },
      ]);

      await sendEmailNotification({
        name: studentName,
        subject: `Confirmación de Préstamo #${newLoan.id} - Biblioteca UCE`,
        message: `Has reservado exitosamente el libro "${variables.title}".
        
        ------------------------------------------
        🧾 CÓDIGO DE TRANSACCIÓN: #${newLoan.id}
        ------------------------------------------
        
        Tienes 24 horas para retirarlo.`,
        target: "student",
      });

      await sendEmailNotification({
        name: "Administrador",
        subject: `🔔 Nuevo Préstamo #${newLoan.id} (Sistema)`,
        message: `ATENCIÓN: El estudiante ${studentName} ha solicitado el libro "${variables.title}".
        
        Código de Trazabilidad: #${newLoan.id}`,
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

  // 4. REALTIME
  useRealtime("books", () => {
    queryClient.invalidateQueries({ queryKey: ["catalog"] });
    queryClient.invalidateQueries({ queryKey: ["top-books"] });
    queryClient.invalidateQueries({ queryKey: ["my-loans"] });
  });

  const handleRequestClick = (book) => {
    setBookToRequest(book);
  };

  const confirmLoan = () => {
    if (bookToRequest) {
      loanMutation.mutate(bookToRequest);
    }
  };

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
      {/* 1. HERO SECTION */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

        <div>
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            Biblioteca Digital
          </h2>
          <p className="text-gray-500 mt-2">
            Explora nuestro catálogo y reserva tu próximo libro.
          </p>
        </div>

        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por título, autor o categoría..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-lg shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-12">
        {/* 2. SECCIÓN TOP 5 */}
        {!debouncedSearchTerm && topBooks.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Los Más Solicitados
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {topBooks.map((book, idx) => (
                <div
                  key={book.id}
                  className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-gray-100 overflow-hidden cursor-pointer flex flex-col h-full"
                >
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur text-gray-800 text-xs font-bold px-2 py-1 rounded-md shadow-sm z-10 flex items-center gap-1 border border-gray-100">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{" "}
                    Top {idx + 1}
                  </div>

                  {/* PORTADA REAL */}
                  <div className="h-48 w-full relative overflow-hidden bg-gray-100">
                    <img
                      src={
                        book.cover_url || getCategoryCoverImage(book.category)
                      }
                      alt={book.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h4
                      className="font-bold text-gray-800 text-sm line-clamp-2 mb-1"
                      title={book.title}
                    >
                      {book.title}
                    </h4>
                    <p className="text-xs text-gray-500 truncate mb-4">
                      {book.author}
                    </p>

                    <div className="mt-auto">
                      <button
                        onClick={() => handleRequestClick(book)}
                        disabled={book.status !== "DISPONIBLE"}
                        className={`w-full py-2 text-xs font-bold rounded-xl transition-all shadow-sm border border-transparent
                          ${
                            book.status === "DISPONIBLE"
                              ? "bg-gray-900 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-95"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100"
                          }`}
                      >
                        {book.status === "DISPONIBLE" ? "Solicitar" : "Ocupado"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. CATÁLOGO PRINCIPAL */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-end mb-6 gap-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                Catálogo General
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {isLoading ? "Cargando..." : `${totalBooks} libros disponibles`}
              </p>
            </div>

            {totalPages > 1 && (
              <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-all text-gray-600"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center px-2 text-sm font-medium text-gray-600">
                  {page} / {totalPages}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-all text-gray-600"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-96 bg-gray-200 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : books.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group h-full"
                >
                  {/* 🟢 PORTADA REAL (Imagen) */}
                  <div className="h-56 relative bg-gray-100 overflow-hidden">
                    <img
                      src={
                        book.cover_url || getCategoryCoverImage(book.category)
                      }
                      alt={book.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Badge de Estado Superpuesto */}
                    <div className="absolute top-3 right-3 z-10">
                      {book.status === "DISPONIBLE" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur text-emerald-700 shadow-sm uppercase tracking-wide">
                          <CheckCircle className="w-3 h-3" /> Disponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur text-orange-700 shadow-sm uppercase tracking-wide">
                          <Clock className="w-3 h-3" /> Prestado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* INFO */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex-1 mb-4">
                      <h3
                        className="text-gray-900 font-bold text-lg leading-tight line-clamp-2 mb-2"
                        title={book.title}
                      >
                        {book.title}
                      </h3>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        <p className="text-gray-500 text-sm font-medium truncate">
                          {book.author}
                        </p>
                      </div>

                      <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-md uppercase tracking-wide">
                        {book.category || "General"}
                      </span>
                    </div>

                    {/* BOTÓN DE ACCIÓN */}
                    <div className="mt-auto pt-4 border-t border-gray-50">
                      <button
                        onClick={() => handleRequestClick(book)}
                        disabled={
                          book.status !== "DISPONIBLE" ||
                          (loanMutation.isLoading &&
                            loanMutation.variables?.id === book.id)
                        }
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 border border-transparent
                          ${
                            book.status === "DISPONIBLE"
                              ? "bg-gray-900 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-95"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                      >
                        {loanMutation.isLoading &&
                        loanMutation.variables?.id === book.id ? (
                          <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                        ) : book.status === "DISPONIBLE" ? (
                          "Solicitar Préstamo"
                        ) : (
                          "No Disponible"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                No encontramos libros
              </h3>
              <p className="text-gray-500 mt-2">Intenta ajustar tu búsqueda.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all text-gray-600"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="px-6 text-base font-semibold text-gray-700">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all text-gray-600"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* --- MODALES --- */}
      {bookToRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center transform transition-all scale-100">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ¿Solicitar Libro?
            </h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Estás a punto de pedir prestado <br />
              <span className="font-bold text-gray-800">
                "{bookToRequest.title}"
              </span>
              .
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={confirmLoan}
                disabled={loanMutation.isLoading}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 active:scale-95 flex items-center justify-center gap-2"
              >
                {loanMutation.isLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
                ) : (
                  "Sí, Confirmar Solicitud"
                )}
              </button>
              <button
                onClick={() => setBookToRequest(null)}
                className="w-full py-3.5 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ¡Solicitud Exitosa!
            </h3>
            <p className="text-gray-500 mb-8 leading-relaxed whitespace-pre-line">
              {successMessage}
            </p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
