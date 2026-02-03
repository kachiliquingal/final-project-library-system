import { useState, useEffect } from "react";
import { supabase } from "../../api/supabaseClient";
import { useRealtime } from "../../hooks/useRealtime";
import { useDebounce } from "../../hooks/useDebounce";
import { exportToCSV, exportToPDF } from "../../utils/reportGenerator";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

import UserFilters from "../../components/admin/users/UserFilters";
import UsersTable from "../../components/admin/users/UsersTable";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [page, setPage] = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const ITEMS_PER_PAGE = 8;

  const queryClient = useQueryClient();

  // QUERY
  const {
    data: queryResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["profiles", page, debouncedSearchTerm],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(
          `
          *,
          loans (
            id,
            status
          )
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false });

      if (debouncedSearchTerm) {
        query = query.or(
          `full_name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%`,
        );
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;
      return { data, count };
    },
    staleTime: 0,
    keepPreviousData: true,
  });

  const users = queryResponse?.data || [];
  const totalItems = queryResponse?.count || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  // EXPORT FUNCTION
  const handleExport = async (type) => {
    setShowExportMenu(false);

    const columns = [
      { header: "ID", accessor: "id" },
      { header: "Nombre Completo", accessor: "full_name" },
      { header: "Correo Electrónico", accessor: "email" },
      { header: "Rol", accessor: "role" },
      { header: "Préstamos Activos", accessor: "active_loans" },
      { header: "Fecha Registro", accessor: "created_at" },
    ];

    try {
      let query = supabase
        .from("profiles")
        .select(
          `
          *,
          loans (status)
        `,
        )
        .order("created_at", { ascending: false });

      if (debouncedSearchTerm) {
        query = query.or(
          `full_name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      const processedData = data.map((user) => ({
        id: user.id,
        full_name: user.full_name || "Sin Nombre",
        email: user.email,
        role: user.role === "admin" ? "Administrador" : "Estudiante",
        active_loans: user.loans
          ? user.loans.filter((l) => l.status === "ACTIVO").length
          : 0,
        created_at: new Date(user.created_at).toLocaleDateString("es-EC"),
      }));

      if (type === "csv") {
        exportToCSV(processedData, "Reporte_Usuarios", columns);
      } else {
        exportToPDF(
          processedData,
          "Directorio de Usuarios Registrados",
          columns,
        );
      }
    } catch (err) {
      alert("Error al exportar: " + err.message);
    }
  };

  // REALTIME LISTENERS
  useRealtime("profiles", () => {
    queryClient.invalidateQueries({ queryKey: ["profiles"] });
  });

  useRealtime("loans", () => {
    queryClient.invalidateQueries({ queryKey: ["profiles"] });
  });

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <h3 className="font-bold">Error cargando usuarios</h3>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        showExportMenu={showExportMenu}
        setShowExportMenu={setShowExportMenu}
        onExport={handleExport}
      />

      <UsersTable
        isLoading={isLoading}
        users={users}
        totalItems={totalItems}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
