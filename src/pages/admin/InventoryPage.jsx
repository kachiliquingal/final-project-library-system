import { useState, useEffect } from "react";
import { supabase } from "../../api/supabaseClient";
import { useRealtime } from "../../hooks/useRealtime";
import { useDebounce } from "../../hooks/useDebounce";
import { exportToCSV, exportToPDF } from "../../utils/reportGenerator";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  AlertCircle,
  X,
  Save,
  TriangleAlert,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FileSpreadsheet,
} from "lucide-react";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const ITEMS_PER_PAGE = 8;
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [deletingBook, setDeletingBook] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
  });

  // DATA QUERY
  const {
    data: queryResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["books", page, filterStatus, debouncedSearchTerm],
    queryFn: async () => {
      let query = supabase
        .from("books")
        .select("*", { count: "exact" })
        .eq("is_active", true);

      if (filterStatus !== "ALL") {
        query = query.eq("status", filterStatus);
      }

      query = query.order("id", { ascending: true });

      if (!debouncedSearchTerm) {
        const from = (page - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        query = query.range(from, to);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { data, count };
    },
    staleTime: 1000 * 60,
    keepPreviousData: true,
  });

  // Handle Search & Pagination Logic
  const rawBooks = queryResponse?.data || [];
  const serverCount = queryResponse?.count || 0;

  let displayBooks = [];
  let totalCount = 0;

  if (debouncedSearchTerm) {
    // Client-Side Search
    const searchLower = debouncedSearchTerm.toLowerCase();
    const filtered = rawBooks.filter((book) => {
      return (
        book.title?.toLowerCase().includes(searchLower) ||
        book.author?.toLowerCase().includes(searchLower)
      );
    });

    totalCount = filtered.length;
    displayBooks = filtered.slice(
      (page - 1) * ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE,
    );
  } else {
    displayBooks = rawBooks;
    totalCount = serverCount;
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  // Reset page on filter/search change
  useEffect(() => {
    setPage(1);
  }, [filterStatus, debouncedSearchTerm]);

  // EXPORT FUNCTION
  const handleExport = async (type) => {
    setShowExportMenu(false);

    // Define columns for the report
    const columns = [
      { header: "ID", accessor: "id" },
      { header: "Título", accessor: "title" },
      { header: "Autor", accessor: "author" },
      { header: "Categoría", accessor: "category" },
      { header: "Estado", accessor: "status" },
      { header: "Fecha Registro", accessor: "created_at" },
    ];

    try {
      // Fetch ALL matching data for the report (ignoring pagination)
      let query = supabase.from("books").select("*").eq("is_active", true);

      if (filterStatus !== "ALL") {
        query = query.eq("status", filterStatus);
      }

      if (debouncedSearchTerm) {
        query = query.or(
          `title.ilike.%${debouncedSearchTerm}%,author.ilike.%${debouncedSearchTerm}%`,
        );
      }

      const { data, error } = await query.order("id", { ascending: true });

      if (error) throw error;

      const formattedData = data.map((item) => ({
        ...item,
        created_at: new Date(item.created_at).toLocaleDateString("es-EC"),
      }));

      // Generate File
      if (type === "csv") {
        exportToCSV(formattedData, "Reporte_Inventario", columns);
      } else {
        exportToPDF(formattedData, "Reporte de Inventario de Libros", columns);
      }
    } catch (err) {
      alert("Error generando el reporte: " + err.message);
    }
  };

  const showSuccess = (msg) => {
    closeModals();
    setSuccessMessage(msg);
  };

  // MUTATIONS
  const createMutation = useMutation({
    mutationFn: async (newBook) => {
      const { error } = await supabase
        .from("books")
        .insert([{ ...newBook, status: "DISPONIBLE" }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      showSuccess("¡Libro creado exitosamente!");
    },
    onError: (err) => alert("Error al crear: " + err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (bookData) => {
      const { error } = await supabase
        .from("books")
        .update({
          title: bookData.title,
          author: bookData.author,
          category: bookData.category,
        })
        .eq("id", editingBook.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      showSuccess("Libro actualizado correctamente.");
    },
    onError: (err) => alert("Error al actualizar: " + err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (bookId) => {
      const { error } = await supabase
        .from("books")
        .update({ is_active: false })
        .eq("id", bookId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      showSuccess("Libro eliminado correctamente (Archivado).");
    },
    onError: (err) => alert("Error al eliminar: " + err.message),
  });

  useRealtime("books", () => {
    queryClient.invalidateQueries({ queryKey: ["books"] });
  });

  // HANDLERS
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const openCreateModal = () => {
    setFormData({ title: "", author: "", category: "" });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category || "",
    });
  };

  const openDeleteModal = (book) => {
    setDeletingBook(book);
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setEditingBook(null);
    setDeletingBook(null);
    setFormData({ title: "", author: "", category: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.author || !formData.category) return;

    if (editingBook) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingBook) {
      deleteMutation.mutate(deletingBook.id);
    }
  };

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <h3 className="font-bold">Error cargando inventario</h3>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  const isFormOpen = isCreateModalOpen || !!editingBook;

  return (
    <div className="space-y-6 relative">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
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

        <div className="flex gap-3 w-full md:w-auto items-center">
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

          {/* EXPORT BUTTON & DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-200"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fadeIn">
                <button
                  onClick={() => handleExport("csv")}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  Descargar CSV
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50"
                >
                  <FileText className="w-4 h-4 text-red-600" />
                  Descargar PDF
                </button>
              </div>
            )}
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Libro</span>
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4 w-1/3">Libro</th>
                <th className="px-6 py-4">Autor</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
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
              ) : displayBooks.length > 0 ? (
                displayBooks.map((book) => (
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
                        <span className="font-medium text-gray-800 text-sm leading-snug">
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
                          onClick={() => openEditModal(book)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(book)}
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

        {/* PAGINATION */}
        {displayBooks.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              Mostrando {displayBooks.length} de {totalCount} libros
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm font-medium text-gray-700">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
                className="p-1 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}

      {/* 1. FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingBook ? "Editar Libro" : "Agregar Nuevo Libro"}
              </h3>
              <button
                onClick={closeModals}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título del Libro
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Ej: Clean Code"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Autor
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Ej: Robert C. Martin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Ej: Programación"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isLoading || updateMutation.isLoading
                  }
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-800 font-medium transition-colors flex justify-center items-center gap-2"
                >
                  {createMutation.isLoading || updateMutation.isLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />{" "}
                      {editingBook ? "Actualizar" : "Guardar"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CONFIRM DELETE MODAL (SOFT DELETE) */}
      {deletingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TriangleAlert className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              ¿Eliminar libro?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Estás a punto de eliminar <strong>"{deletingBook.title}"</strong>.{" "}
              <br />
              <span className="text-gray-400 font-medium text-xs mt-2 block">
                (El historial de préstamos se conservará, pero el libro ya no
                aparecerá en el inventario activo).
              </span>
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={closeModals}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center gap-2"
              >
                {deleteMutation.isLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
                ) : (
                  "Sí, Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUCCESS MODAL */}
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
