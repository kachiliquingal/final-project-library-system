import { useState } from "react";
import { supabase } from "../../api/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useRealtime } from "../../hooks/useRealtime";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { sendEmailNotification } from "../../api/emailService";
import {
  Search,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Star,
  TriangleAlert,
  X,
} from "lucide-react";

// 🟢 MAPA DE COLORES POR CATEGORÍA
const getCategoryColor = (category) => {
  const normalizedCategory = category?.toLowerCase().trim() || "";

  if (
    normalizedCategory.includes("matemática") ||
    normalizedCategory.includes("calculo")
  )
    return "from-blue-600 to-indigo-600";
  if (
    normalizedCategory.includes("fisica") ||
    normalizedCategory.includes("física")
  )
    return "from-violet-600 to-purple-600";
  if (
    normalizedCategory.includes("quimica") ||
    normalizedCategory.includes("química")
  )
    return "from-emerald-500 to-teal-600";
  if (
    normalizedCategory.includes("programacion") ||
    normalizedCategory.includes("sistemas") ||
    normalizedCategory.includes("software")
  )
    return "from-slate-700 to-gray-800";
  if (
    normalizedCategory.includes("redes") ||
    normalizedCategory.includes("telecom")
  )
    return "from-cyan-600 to-blue-500";
  if (
    normalizedCategory.includes("electronica") ||
    normalizedCategory.includes("eléctrica")
  )
    return "from-amber-500 to-orange-600";

  return "from-gray-500 to-slate-600";
};

export default function UserCatalog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // MODALES
  const [bookToRequest, setBookToRequest] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // 1. QUERY: Catálogo (Libros Paginados)
  const {
    data: queryData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["catalog", page, searchTerm],
    queryFn: async () => {
      let query = supabase.from("books").select("*", { count: "exact" });

      if (searchTerm) {
        query = query.or(
          `title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`,
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

  // 2. QUERY: Top 5 Global (Usando RPC para saltar RLS)
  const { data: topBooks = [] } = useQuery({
    queryKey: ["top-books"],
    queryFn: async () => {
      // 🟢 CORRECCIÓN: Usamos la función RPC que creamos en Supabase
      // Esto asegura que el conteo sea GLOBAL y no solo del usuario actual
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

  // 3. MUTATION: Solicitar Préstamo (MODIFICADO PARA TRAZABILIDAD)
  const loanMutation = useMutation({
    mutationFn: async (book) => {
      // Actualizar estado del libro
      const { data: updatedBook, error: updateError } = await supabase
        .from("books")
        .update({ status: "PRESTADO" })
        .eq("id", book.id)
        .eq("status", "DISPONIBLE")
        .select();

      if (updateError) throw updateError;
      if (!updatedBook || updatedBook.length === 0)
        throw new Error("ALREADY_TAKEN");

      // Insertar préstamo y RECUPERAR EL ID (Trazabilidad)
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
        .select() // 🟢 Importante: Solicita devolver los datos insertados
        .single(); // 🟢 Importante: Devuelve un solo objeto

      if (loanError) throw loanError;
      return newLoan; // 🟢 Retornamos el préstamo creado para usar su ID
    },
    onSuccess: async (newLoan, variables) => {
      // newLoan contiene el ID de la transacción
      setBookToRequest(null);

      // 🟢 MOSTRAR CÓDIGO EN PANTALLA
      setSuccessMessage(
        `¡Solicitud Exitosa! Tu código de transacción es #${newLoan.id}. Por favor acércate a la biblioteca.`,
      );

      const studentName = user.name || user.email;

      // Notificación BD (Con código)
      await supabase.from("notifications").insert([
        {
          type: "LOAN",
          message: `Préstamo #${newLoan.id}: Se ha registrado el libro "${variables.title}" a nombre de ${studentName}.`,
          user_id: user.id,
        },
      ]);

      // Correos (Con código de trazabilidad visible)
      await sendEmailNotification({
        name: studentName,
        subject: `Confirmación de Préstamo #${newLoan.id} - Biblioteca UCE`,
        message: `Has reservado exitosamente el libro "${variables.title}".
        
        ------------------------------------------
        🧾 CÓDIGO DE TRANSACCIÓN: #${newLoan.id}
        ------------------------------------------
        
        Tienes 24 horas para retirarlo. Presenta este código si es necesario.`,
        target: "student",
      });

      await sendEmailNotification({
        name: "Administrador",
        subject: `🔔 Nuevo Préstamo #${newLoan.id} (Sistema)`,
        message: `ATENCIÓN: El estudiante ${studentName} ha solicitado el libro "${variables.title}".
        
        Código de Trazabilidad: #${newLoan.id}`,
        target: "admin",
      });

      // Actualizar todas las vistas
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

  // 4. REALTIME: Escuchar cambios en libros y PRÉSTAMOS
  // 🟢 AGREGADO: Escuchamos 'loans' para que el Top 5 cambie en vivo si otro estudiante pide algo
  useRealtime("books", () => {
    queryClient.invalidateQueries({ queryKey: ["catalog"] });
    queryClient.invalidateQueries({ queryKey: ["top-books"] });
  });

  useRealtime("loans", () => {
    queryClient.invalidateQueries({ queryKey: ["top-books"] }); // Actualiza el top si hay nuevos préstamos
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
        {!searchTerm && topBooks.length > 0 && (
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
                  className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-gray-100 overflow-hidden cursor-pointer"
                >
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur text-gray-800 text-xs font-bold px-2 py-1 rounded-md shadow-sm z-10 flex items-center gap-1 border border-gray-100">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{" "}
                    Top {idx + 1}
                  </div>

                  {/* PORTADA TEMÁTICA */}
                  <div
                    className={`h-36 w-full bg-gradient-to-br ${getCategoryColor(book.category)} p-5 flex items-end relative overflow-hidden transition-colors duration-500`}
                  >
                    <BookOpen className="w-20 h-20 text-white/10 absolute -top-4 -right-4 rotate-12" />
                    <h4 className="text-white font-bold text-sm leading-tight drop-shadow-md relative z-10 line-clamp-2">
                      {book.title}
                    </h4>
                  </div>

                  <div className="p-4">
                    <p className="text-xs text-gray-500 truncate mb-3">
                      {book.author}
                    </p>

                    {/* BOTÓN UNIFICADO */}
                    <button
                      onClick={() => handleRequestClick(book)}
                      disabled={book.status !== "DISPONIBLE"}
                      className={`w-full py-2 text-xs font-bold rounded-xl transition-all shadow-sm border border-transparent
                        ${
                          book.status === "DISPONIBLE"
                            ? "bg-gray-900 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-95"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                      {book.status === "DISPONIBLE" ? "Solicitar" : "Ocupado"}
                    </button>
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
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-72 bg-gray-200 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : books.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                >
                  {/* PORTADA CON COLOR POR CATEGORÍA */}
                  <div
                    className={`h-48 bg-gradient-to-br ${getCategoryColor(book.category)} relative p-6 flex flex-col justify-between transition-colors duration-500`}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                      <BookOpen className="w-24 h-24 text-white rotate-12" />
                    </div>

                    {/* BADGE DE ESTADO */}
                    <div className="self-start relative z-10">
                      {book.status === "DISPONIBLE" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold bg-white text-emerald-600 shadow-lg tracking-wide uppercase">
                          <CheckCircle className="w-3.5 h-3.5" /> Disponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold bg-white text-orange-700 shadow-lg tracking-wide uppercase">
                          <Clock className="w-3.5 h-3.5" /> Prestado
                        </span>
                      )}
                    </div>

                    <h3 className="text-white font-bold text-xl leading-tight drop-shadow-md line-clamp-3 z-10">
                      {book.title}
                    </h3>
                  </div>

                  {/* INFO */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex-1 space-y-2">
                      <p className="text-gray-500 text-sm font-medium flex items-center gap-2">
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        {book.author}
                      </p>
                      <span className="inline-block px-3 py-1 bg-gray-50 text-gray-500 text-xs font-semibold rounded-full uppercase tracking-wide">
                        {book.category || "General"}
                      </span>
                    </div>

                    {/* BOTÓN DE ACCIÓN UNIFICADO */}
                    <button
                      onClick={() => handleRequestClick(book)}
                      disabled={
                        book.status !== "DISPONIBLE" ||
                        (loanMutation.isLoading &&
                          loanMutation.variables?.id === book.id)
                      }
                      className={`w-full mt-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 border border-transparent
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

          {/* PAGINACIÓN INFERIOR */}
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

      {/* 1. MODAL CONFIRMACIÓN */}
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

      {/* 2. MODAL DE ÉXITO */}
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
