import { useState } from "react";
import { supabase } from "../../api/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useRealtime } from "../../hooks/useRealtime";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // <--- 1. Importamos TanStack
import {
  Clock,
  Calendar,
  BookOpen,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function UserLoans() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("active"); // 'active' | 'history'

  // Cliente para controlar la caché manualmente
  const queryClient = useQueryClient();

  // 🔴 2. USEQUERY: Reemplaza a tu useEffect y useState de loans
  const {
    data: loans = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    // La clave única de la caché. Si cambia el usuario, cambian los datos.
    queryKey: ["my-loans", user?.id],

    queryFn: async () => {
      if (!user) return [];
      console.log("📡 Cargando mis préstamos desde Supabase...");

      const { data, error } = await supabase
        .from("loans")
        .select(
          `
          id,
          loan_date,
          return_date,
          status,
          user_id, 
          books ( title, author, category, id )
        `
        )
        .eq("user_id", user.id)
        .order("loan_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    // Solo se ejecuta si hay usuario
    enabled: !!user,
    // ¡IMPORTANTE! NO ponemos staleTime.
    // Por defecto es 0, lo que significa que siempre verificará datos nuevos.
    // Esto asegura la actualización INMEDIATA que necesitas para el ingeniero.
  });

  // 🔴 3. REALTIME: Tu lógica original adaptada a TanStack
  useRealtime("loans", (payload) => {
    // Mantenemos tu optimización: Solo si el cambio es mío
    const changedUserId = payload.new?.user_id || payload.old?.user_id;

    if (changedUserId === user?.id) {
      console.log(
        "⚡ Cambio en mis préstamos detectado -> Actualizando caché INMEDIATAMENTE..."
      );
      // Esto fuerza a TanStack a volver a pedir los datos en ese preciso instante
      queryClient.invalidateQueries({ queryKey: ["my-loans", user.id] });
    }
  });

  const formatDate = (dateString) => {
    if (!dateString) return "Pendiente";
    return new Date(dateString).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Filtrado local (Igual que tenías)
  const activeLoans = loans.filter((loan) => loan.status === "ACTIVO");
  const historyLoans = loans.filter((loan) => loan.status !== "ACTIVO");
  const displayLoans = activeTab === "active" ? activeLoans : historyLoans;

  // Manejo de error visual
  if (isError) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100 max-w-5xl mx-auto mt-10">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <h3 className="font-bold">Error cargando tus préstamos</h3>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. HEADER DE PERFIL */}
      <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white/20">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>

        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl font-bold">{user?.name}</h2>
          <p className="text-blue-200 text-sm">{user?.email}</p>

          <div className="flex gap-4 mt-4 justify-center md:justify-start">
            <div className="bg-white/10 px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
              <span className="font-bold text-white text-lg mr-2">
                {activeLoans.length}
              </span>
              <span className="text-blue-200">Préstamos Activos</span>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
              <span className="font-bold text-white text-lg mr-2">
                {historyLoans.length}
              </span>
              <span className="text-blue-200">Devueltos</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TABS DE NAVEGACIÓN */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-4 px-6 text-sm font-medium transition-all relative ${
            activeTab === "active"
              ? "text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Préstamos Activos
          {activeTab === "active" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-4 px-6 text-sm font-medium transition-all relative ${
            activeTab === "history"
              ? "text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Historial de Devoluciones
          {activeTab === "history" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>
          )}
        </button>
      </div>

      {/* 3. LISTA DE PRÉSTAMOS */}
      {isLoading ? ( // Usamos isLoading de TanStack
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : displayLoans.length > 0 ? (
        <div className="grid gap-4">
          {displayLoans.map((loan) => (
            <div
              key={loan.id}
              className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl ${
                    loan.status === "ACTIVO"
                      ? "bg-orange-50 text-orange-600"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {loan.books?.title || "Libro no encontrado"}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {loan.books?.author} • {loan.books?.category}
                  </p>

                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      <Calendar className="w-3.5 h-3.5" />
                      Prestado: {formatDate(loan.loan_date)}
                    </div>

                    {loan.return_date && (
                      <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Devuelto: {formatDate(loan.return_date)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto text-right">
                {loan.status === "ACTIVO" ? (
                  <div className="inline-flex flex-col items-end">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 mb-1">
                      <Clock className="w-3 h-3" /> EN CURSO
                    </span>
                    <span className="text-xs text-gray-400">
                      Debes devolverlo en biblioteca
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                    COMPLETADO
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-gray-900 font-medium">
            No hay préstamos en esta sección
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            {activeTab === "active"
              ? "No tienes libros pendientes de devolución."
              : "Aún no has devuelto ningún libro."}
          </p>
        </div>
      )}
    </div>
  );
}
