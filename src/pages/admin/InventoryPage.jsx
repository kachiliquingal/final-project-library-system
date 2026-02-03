import { useState, useEffect } from "react";
import { supabase } from "../../api/supabaseClient";
import { useRealtime } from "../../hooks/useRealtime";
import { useDebounce } from "../../hooks/useDebounce";
import { exportToCSV, exportToPDF } from "../../utils/reportGenerator";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

import InventoryFilters from "../../components/admin/inventory/InventoryFilters";
import InventoryTable from "../../components/admin/inventory/InventoryTable";
import BookFormModal from "../../components/admin/inventory/BookFormModal";
import DeleteBookModal from "../../components/admin/inventory/DeleteBookModal";
import SuccessModal from "../../components/common/SuccessModal";

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

  useEffect(() => {
    setPage(1);
  }, [filterStatus, debouncedSearchTerm]);

  // EXPORT FUNCTION
  const handleExport = async (type) => {
    setShowExportMenu(false);
    const columns = [
      { header: "ID", accessor: "id" },
      { header: "Título", accessor: "title" },
      { header: "Autor", accessor: "author" },
      { header: "Categoría", accessor: "category" },
      { header: "Estado", accessor: "status" },
      { header: "Fecha Registro", accessor: "created_at" },
    ];

    try {
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
    if (editingBook) updateMutation.mutate(formData);
    else createMutation.mutate(formData);
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

  return (
    <div className="space-y-6 relative">
      <InventoryFilters
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        filterStatus={filterStatus}
        onFilterChange={(e) => {
          setFilterStatus(e.target.value);
          setPage(1);
        }}
        showExportMenu={showExportMenu}
        setShowExportMenu={setShowExportMenu}
        onExport={handleExport}
        onOpenCreate={openCreateModal}
      />

      <InventoryTable
        isLoading={isLoading}
        books={displayBooks}
        totalCount={totalCount}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onEdit={openEditModal}
        onDelete={setDeletingBook}
      />

      <BookFormModal
        isOpen={isCreateModalOpen || !!editingBook}
        onClose={closeModals}
        onSubmit={handleSubmit}
        formData={formData}
        onInputChange={handleInputChange}
        isEditing={!!editingBook}
        isLoading={createMutation.isLoading || updateMutation.isLoading}
      />

      <DeleteBookModal
        isOpen={!!deletingBook}
        onClose={closeModals}
        onConfirm={() => deletingBook && deleteMutation.mutate(deletingBook.id)}
        bookTitle={deletingBook?.title}
        isLoading={deleteMutation.isLoading}
      />

      <SuccessModal
        isOpen={!!successMessage}
        message={successMessage}
        onClose={() => setSuccessMessage(null)}
      />
    </div>
  );
}
