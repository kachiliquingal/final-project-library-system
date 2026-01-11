import { useEffect, useState } from "react";
import { supabase } from "../../api/supabaseClient";
import { Search, BookOpen, Clock, CheckCircle, XCircle } from "lucide-react";

export default function UserCatalog() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("title", { ascending: true });

      if (error) throw error;
      setBooks(data);
    } catch (error) {
      console.error("Error al cargar libros:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado en tiempo real
  const filteredBooks = books.filter((book) => {
    const term = searchTerm.toLowerCase();
    return (
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term) ||
      book.category.toLowerCase().includes(term)
    );
  });

  // Simulación de "Top 5" (Tomamos los primeros 5 del filtro actual)
  const topBooks = filteredBooks.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* 1. BUSCADOR HERO */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">
          ¿Qué libro estás buscando hoy?
        </h2>
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por título, autor o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          {/* 2. SECCIÓN TOP 5 (Estilo Carrusel/Tarjetas destacadas) */}
          {topBooks.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-yellow-100 text-yellow-700 p-1 rounded">
                  🔥
                </span>
                Destacados
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {topBooks.map((book) => (
                  <div
                    key={book.id}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden"
                  >
                    {/* Placeholder de Portada (Gradiente simple) */}
                    <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                      <BookOpen className="w-8 h-8 text-gray-300" />
                    </div>
                    
                    <h4 className="font-bold text-gray-800 text-sm line-clamp-2 mb-1" title={book.title}>
                      {book.title}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">{book.author}</p>
                    
                    <div className="flex justify-between items-center mt-auto">
                        <span className="text-[10px] font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600">
                            {book.category}
                        </span>
                        {book.status === 'DISPONIBLE' ? (
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="Disponible"></div>
                        ) : (
                            <div className="w-2 h-2 bg-red-500 rounded-full" title="Prestado"></div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. CATÁLOGO GENERAL (Grid completa) */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 mb-4 mt-8 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Catálogo Completo ({filteredBooks.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-primary/30 transition-colors flex flex-col"
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

                    <h4 className="text-base font-bold text-gray-800 mb-1 leading-tight">
                      {book.title}
                    </h4>
                    <p className="text-sm text-gray-500 mb-3">{book.author}</p>
                    
                    <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded-lg inline-block">
                        {book.category || 'General'}
                    </div>
                  </div>

                  {/* Botón de Acción (Simulado por ahora) */}
                  <div className="p-4 border-t border-gray-50 bg-gray-50/50">
                    <button 
                        disabled={book.status !== 'DISPONIBLE'}
                        className="w-full py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-gray-200 text-gray-700 hover:bg-primary hover:text-white hover:border-transparent"
                    >
                        {book.status === 'DISPONIBLE' ? 'Solicitar Préstamo' : 'No Disponible'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredBooks.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No se encontraron libros con ese criterio.</p>
                </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}