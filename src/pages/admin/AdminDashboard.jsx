import { supabase } from "../../api/supabaseClient";
import { useRealtime } from "../../hooks/useRealtime";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BookOpen,
  ClipboardList,
  CheckSquare,
  Users,
  AlertCircle,
} from "lucide-react";

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  // 1. USEQUERY: Carga todo el dashboard
  const {
    data: dashboard,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      console.log("📡 Actualizando Dashboard (Datos Server-Side)...");

      const [booksRes, usersRes, activeLoansRes, loansDataRes, topBooksRes] =
        await Promise.all([
          supabase.from("books").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase
            .from("loans")
            .select("*", { count: "exact", head: true })
            .eq("status", "ACTIVO"),
          supabase // Datos para la gráfica de días
            .from("loans")
            .select("loan_date, status")
            .order("loan_date", { ascending: false }),
          supabase.rpc("get_top_books"), // 🟢 RPC ACTUALIZADA (Trae loan_count)
        ]);

      if (booksRes.error) throw booksRes.error;
      if (usersRes.error) throw usersRes.error;
      if (activeLoansRes.error) throw activeLoansRes.error;
      if (loansDataRes.error) throw loansDataRes.error;
      if (topBooksRes.error) throw topBooksRes.error;

      // Procesar Estadísticas
      const totalBooks = booksRes.count || 0;
      const totalUsers = usersRes.count || 0;
      const activeLoans = activeLoansRes.count || 0;
      const availableBooks = totalBooks - activeLoans;

      // Procesar Gráfica
      const chartData = processChartData(loansDataRes.data || []);

      // Procesar Top 5 (Ahora es directo, sin cálculos manuales)
      const topBooks = (topBooksRes.data || []).map((book, index) => ({
        ...book,
        ranking: index + 1,
        // 🟢 Aquí usamos el dato directo de la BD
        displayCount: book.loan_count || 0,
      }));

      return {
        stats: { totalBooks, totalUsers, activeLoans, availableBooks },
        chartData,
        topBooks,
      };
    },
    staleTime: 0,
  });

  // Función auxiliar SOLO para la gráfica de días
  const processChartData = (loans) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

    loans.forEach((loan) => {
      if (loan.loan_date) {
        const date = new Date(loan.loan_date);
        const dayName = days[date.getDay()];
        if (counts[dayName] !== undefined) {
          counts[dayName]++;
        }
      }
    });

    return Object.keys(counts).map((key) => ({
      name: key,
      loans: counts[key],
    }));
  };

  // 2. REALTIME (Se mantiene igual para actualizar al instante)
  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
  };

  useRealtime("loans", refreshAll);
  useRealtime("books", refreshAll);
  useRealtime("profiles", refreshAll);

  // Defaults
  const stats = dashboard?.stats || {
    totalBooks: 0,
    activeLoans: 0,
    availableBooks: 0,
    totalUsers: 0,
  };
  const chartData = dashboard?.chartData || [];
  const topBooks = dashboard?.topBooks || [];

  const statCards = [
    {
      label: "Total Libros",
      value: stats.totalBooks,
      icon: BookOpen,
      color: "bg-blue-500",
      bg: "bg-blue-100",
    },
    {
      label: "Préstamos Activos",
      value: stats.activeLoans,
      icon: ClipboardList,
      color: "bg-purple-500",
      bg: "bg-purple-100",
    },
    {
      label: "Disponibles",
      value: stats.availableBooks,
      icon: CheckSquare,
      color: "bg-green-500",
      bg: "bg-green-100",
    },
    {
      label: "Usuarios",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-orange-500",
      bg: "bg-orange-100",
    },
  ];

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <h3 className="font-bold">Error cargando dashboard</h3>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TARJETAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">
                {stat.label}
              </p>
              <h3 className="text-3xl font-bold text-gray-800">{stat.value}</h3>
            </div>
            <div
              className={`p-3 rounded-xl ${stat.color} text-white shadow-md`}
            >
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* GRÁFICAS Y TOP 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRÁFICA */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Préstamos por Día de la Semana
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  dy={10}
                />
                <Tooltip
                  cursor={{ fill: "#f3f4f6" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar
                  dataKey="loans"
                  fill="#003666"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LISTA TOP 5 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Top 5 Libros Solicitados
          </h3>
          <div className="space-y-6">
            {topBooks.length > 0 ? (
              topBooks.map((book) => (
                <div key={book.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 font-bold text-sm shrink-0">
                    {book.ranking}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4
                      className="text-sm font-semibold text-gray-800 truncate"
                      title={book.title}
                    >
                      {book.title}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
                      {book.author}
                    </p>
                  </div>

                  {/* 🟢 BADGE CON EL NÚMERO REAL */}
                  <div className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap border border-blue-100">
                    {book.displayCount} prest.
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400 text-sm">
                No hay datos de préstamos aún.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
