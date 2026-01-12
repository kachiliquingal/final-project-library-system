import { useEffect, useState } from "react";
import { supabase } from "../../api/supabaseClient";
import { Search, Plus, Edit, Trash2, BookOpen } from "lucide-react";

export default function InventoryPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL, DISPONIBLE, PRESTADO
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchBooks();

    // 🔴 1. INICIO DE REALTIME (LA ANTENA PARA EL ADMIN)
    // Esto permite que el Admin vea cambios (como préstamos) al instante
    const channel = supabase
      .channel("admin-inventory-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE", // Escuchamos actualizaciones (ej: cambio de estado)
          schema: "public",
          table: "books",
        },
        (payload) => {
          // payload.new trae el libro actualizado
          const updatedBook = payload.new;

          // Actualizamos la tabla localmente sin recargar
          setBooks((prevBooks) =>
            prevBooks.map((book) =>
              book.id === updatedBook.id ? { ...book, ...updatedBook } : book
            )
          );
        }
      )
      .subscribe();

    // 🔴 2. LIMPIEZA
    return () => {
      supabase.removeChannel(channel);
    };
  }, [page, filterStatus, searchTerm]); // Se reinicia si cambian los filtros

  const fetchBooks = async () => {
    setLoading(true);
    try {
      let query = supabase.from("books").select("*", { count: "exact" });

      // 1. Filtro por Búsqueda (Título o Autor)
      if (searchTerm) {
        query = query.or(
          `title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`
        );
      }

      // 2. Filtro por Estado
      if (filterStatus !== "ALL") {
        query = query.eq("status", filterStatus);
      }

      // 3. Paginación
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await query
        .range(from, to)
        .order("id", { ascending: true }); // Ordenar por ID

      if (error) throw error;

      setBooks(data);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setLoading(false);
    }
  };

  // Manejo de cambio en buscador (con debounce manual simple)
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Resetear a página 1 al buscar
  };

  return (
    <div className="space-y-6">
      {/* 1. ENCABEZADO Y CONTROLES */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        {/* Buscador */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título, autor..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Filtros y Botón Nuevo */}
        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="DISPONIBLE">Disponibles</option>
            <option value="PRESTADO">Prestados</option>
          </select>

          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Libro</span>
          </button>
        </div>
      </div>

      {/* 2. TABLA DE RESULTADOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Libro</th>
                <th className="px-6 py-4">Autor</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Cargando catálogo...
                    </div>
                  </td>
                </tr>
              ) : books.length > 0 ? (
                books.map((book) => (
                  <tr
                    key={book.id}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                      #{book.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-800">
                          {book.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {book.author}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {book.category || "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          book.status === "DISPONIBLE"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {book.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center text-gray-400 italic"
                  >
                    No se encontraron libros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 3. PAGINACIÓN */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <span className="text-sm text-gray-500">
            Página <span className="font-bold text-gray-800">{page}</span> de{" "}
            {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
