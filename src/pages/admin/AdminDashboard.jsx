import { useEffect, useState } from "react";
import { supabase } from "../../api/supabaseClient";
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
  Calendar,
  Users,
} from "lucide-react";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBooks: 0,
    activeLoans: 0,
    availableBooks: 0,
    totalUsers: 0,
  });

  const [chartData, setChartData] = useState([]);
  const [topBooks, setTopBooks] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. TOTAL DE LIBROS (Tabla: public.books)
      const { count: booksCount } = await supabase
        .from("books")
        .select("*", { count: "exact", head: true });

      // 2. TOTAL DE USUARIOS (Tabla: public.profiles)
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // 3. PRÉSTAMOS ACTIVOS (Tabla: public.loans, Estado: 'ACTIVO')
      // ¡IMPORTANTE! Aquí corregí el estado a mayúsculas según tu script SQL
      const { count: loansCount } = await supabase
        .from("loans")
        .select("*", { count: "exact", head: true })
        .eq("status", "ACTIVO");

      // Cálculo de disponibles (Total Libros - Préstamos Activos)
      const available = (booksCount || 0) - (loansCount || 0);

      setStats({
        totalBooks: booksCount || 0,
        activeLoans: loansCount || 0,
        availableBooks: available,
        totalUsers: usersCount || 0,
      });

      // 4. DATOS PARA GRÁFICAS Y TOP 5
      // Traemos loans y hacemos join con books para saber el título
      const { data: loansData, error } = await supabase
        .from("loans")
        .select(
          `
          loan_date,
          status,
          books ( title, author )
        `
        )
        .order("loan_date", { ascending: false });

      if (error) throw error;

      if (loansData) {
        processChartData(loansData);
        processTopBooks(loansData);
      }
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Procesar datos para la Gráfica (Préstamos por día de la semana)
  const processChartData = (loans) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

    loans.forEach((loan) => {
      if (loan.loan_date) {
        const date = new Date(loan.loan_date);
        const dayName = days[date.getDay()];
        counts[dayName]++;
      }
    });

    const formattedData = Object.keys(counts).map((key) => ({
      name: key,
      loans: counts[key],
    }));
    setChartData(formattedData);
  };

  // Procesar datos para Top 5 Libros más pedidos
  const processTopBooks = (loans) => {
    const bookCounts = {};

    loans.forEach((loan) => {
      // Accedemos a la relación 'books' definida en tu esquema
      // Si el libro fue borrado, ponemos "Desconocido"
      const title = loan.books?.title || "Libro Desconocido";
      const author = loan.books?.author || "Autor Desconocido";

      if (!bookCounts[title]) {
        bookCounts[title] = { title, author, count: 0 };
      }
      bookCounts[title].count++;
    });

    // Ordenar y tomar top 5
    const sorted = Object.values(bookCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item, index) => ({ ...item, id: index + 1 }));

    setTopBooks(sorted);
  };

  // Tarjetas configuradas según tu Wireframe
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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. TARJETAS DE ESTADÍSTICAS (Diseño Wireframe) */}
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

      {/* 2. SECCIÓN PRINCIPAL: GRÁFICA Y TOP 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRÁFICA (IZQUIERDA - 2 COLUMNAS) */}
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

        {/* LISTA TOP 5 (DERECHA - 1 COLUMNA) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Top 5 Libros Solicitados
          </h3>
          <div className="space-y-6">
            {topBooks.length > 0 ? (
              topBooks.map((book) => (
                <div key={book.id} className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 font-bold text-sm shrink-0">
                    {book.id}
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
                  <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md whitespace-nowrap">
                    {book.count} prest.
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
