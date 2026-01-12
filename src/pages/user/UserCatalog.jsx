import { useEffect, useState } from "react";
import { supabase } from "../../api/supabaseClient";
import { useAuth } from "../../context/AuthContext"; 
import { Search, BookOpen, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";

export default function UserCatalog() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para paginación y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const ITEMS_PER_PAGE = 8; 

  const [processingId, setProcessingId] = useState(null); 

  useEffect(() => {
    fetchBooks();

    // 🔴 1. INICIO DE REALTIME: Escuchar cambios en la tabla 'books'
    const channel = supabase
      .channel('catalog-changes') // Nombre cualquiera para el canal
      .on(
        'postgres_changes', // Tipo de evento: Cambios en Postgres
        {
          event: 'UPDATE',  // Solo nos importan las actualizaciones (cambio de estado)
          schema: 'public',
          table: 'books',   // Tabla específica
        },
        (payload) => {
          // payload.new trae el libro ya actualizado (ej: status = 'PRESTADO')
          const updatedBook = payload.new;
          
          // Actualizamos nuestro estado local instantáneamente
          setBooks((prevBooks) => 
            prevBooks.map((book) => 
              book.id === updatedBook.id 
                ? { ...book, ...updatedBook } // Fusionamos los datos nuevos
                : book
            )
          );
        }
      )
      .subscribe();

    // 🔴 2. LIMPIEZA: Desuscribirse cuando el usuario salga de la página
    return () => {
      supabase.removeChannel(channel);
    };

  }, [page, searchTerm]); // Se reinicia si cambiamos de página

  const fetchBooks = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("books")
        .select("*", { count: "exact" }); 

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await query
        .order("title", { ascending: true })
        .range(from, to);

      if (error) throw error;

      setBooks(data);
      setTotalBooks(count || 0);
    } catch (error) {
      console.error("Error al cargar libros:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLoan = async (book) => {
    if (!window.confirm(`¿Deseas solicitar el préstamo del libro "${book.title}"?`)) return;

    try {
      setProcessingId(book.id); 

      // 1. Bloqueo Optimista
      const { data: updatedBook, error: updateError } = await supabase
        .from("books")
        .update({ status: "PRESTADO" })
        .eq("id", book.id)
        .eq("status", "DISPONIBLE") 
        .select();

      if (updateError) throw updateError;

      if (!updatedBook || updatedBook.length === 0) {
        alert("¡Lo sentimos! Alguien más acaba de solicitar este libro hace un instante.");
        fetchBooks(); 
        return;
      }

      // 2. Crear Ticket
      const loanData = {
        book_id: book.id,
        user_id: user.id, 
        loan_date: new Date().toISOString(),
        return_date: null, 
        status: "ACTIVO"
      };

      const { error: loanError } = await supabase
        .from("loans")
        .insert([loanData]);

      if (loanError) {
        console.error("Error creando ticket:", loanError);
        alert("Ocurrió un error generando el ticket, contacta al administrador.");
      } else {
        alert("¡Préstamo exitoso! Por favor acércate a biblioteca a recoger tu libro.");
        // NOTA: Ya no es estrictamente necesario llamar a fetchBooks() aquí
        // porque el Realtime actualizará la UI solo, pero lo dejamos por seguridad.
        fetchBooks(); 
      }

    } catch (error) {
      console.error("Error en préstamo:", error);
      alert("Error al procesar la solicitud.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); 
  };

  const totalPages = Math.ceil(totalBooks / ITEMS_PER_PAGE);

  return (
    <div className="space-y-8 pb-10">
      {/* 1. BUSCADOR HERO */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Biblioteca de Ingeniería
        </h2>
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por título, autor o categoría..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-lg"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* 2. CATÁLOGO CON TARJETAS */}
          <section>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Catálogo ({totalBooks} resultados)
                </h3>
                
                <span className="text-xs text-gray-500">
                    Página {page} de {totalPages}
                </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-primary/30 transition-colors flex flex-col shadow-sm hover:shadow-md"
                >
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-gray-400">#{book.id}</span>
                        {book.status === "DISPONIBLE" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700">
                            <CheckCircle className="w-3 h-3" /> DISPONIBLE
                        </span>
                        ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700">
                            <Clock className="w-3 h-3" /> PRESTADO
                        </span>
                        )}
                    </div>

                    <h4 className="text-base font-bold text-gray-800 mb-1 leading-tight line-clamp-2" title={book.title}>
                      {book.title}
                    </h4>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-1">{book.author}</p>
                    
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg inline-block">
                        {book.category || 'General'}
                    </div>
                  </div>

                  {/* BOTÓN DE ACCIÓN CON LÓGICA */}
                  <div className="p-4 border-t border-gray-50 bg-gray-50/50">
                    <button 
                        onClick={() => handleRequestLoan(book)}
                        disabled={book.status !== 'DISPONIBLE' || processingId === book.id}
                        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
                            ${book.status === 'DISPONIBLE' 
                                ? 'bg-white border border-gray-200 text-gray-700 hover:bg-primary hover:text-white hover:border-transparent shadow-sm' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent'
                            }
                        `}
                    >
                        {processingId === book.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : (
                            book.status === 'DISPONIBLE' ? 'Solicitar Préstamo' : 'No Disponible'
                        )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {books.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 mt-6">
                    <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No se encontraron libros con ese criterio.</p>
                </div>
            )}

            {/* 3. PAGINACIÓN INFERIOR */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-10">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <span className="text-sm font-medium text-gray-700">
                        Página {page} de {totalPages}
                    </span>

                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}