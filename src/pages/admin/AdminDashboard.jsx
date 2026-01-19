import { useState } from "react";
import { supabase } from "../../api/supabaseClient";
import { useRealtime } from "../../hooks/useRealtime";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCategoryCoverImage } from "../../utils/bookCoverHelper";
import { exportToCSV, exportDashboardPDF } from "../../utils/reportGenerator";
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
  Trophy,
  Download,
  FileText,
  FileSpreadsheet,
  CalendarRange,
} from "lucide-react";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [showExportMenu, setShowExportMenu] = useState(false);

  // STATE FOR TIME FILTER
  const [timeRange, setTimeRange] = useState("all");

  const {
    data: dashboard,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-dashboard", timeRange],
    queryFn: async () => {
      // 1. CALCULATE DATE RANGE
      let startDate = null;

      if (timeRange === "month") {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        startDate = d.toISOString();
      } else if (timeRange === "week") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        startDate = d.toISOString();
      } else if (timeRange === "today") {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        startDate = d.toISOString();
      }

      // 2. PREPARE QUERIES
      // A. Loans made in this period (for charts and outgoing count)
      let borrowedQuery = supabase
        .from("loans")
        .select("loan_date, status, book_id, books(title, author, category)")
        .order("loan_date", { ascending: false });

      // B. Returns made in this period (Incoming count)
      // We use count: 'exact', head: true to only count.
      let returnedQuery = supabase
        .from("loans")
        .select("*", { count: "exact", head: true })
        .not("return_date", "is", null);

      // Apply date filter to both queries
      if (startDate) {
        borrowedQuery = borrowedQuery.gte("loan_date", startDate);
        returnedQuery = returnedQuery.gte("return_date", startDate);
      }

      // 3. RUN EVERYTHING IN PARALLEL
      const [
        booksRes,
        usersRes,
        activeLoansRes,
        borrowedDataRes,
        returnedRes,
        topBooksRes,
      ] = await Promise.all([
        supabase.from("books").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("loans")
          .select("*", { count: "exact", head: true })
          .eq("status", "ACTIVO"),
        borrowedQuery,
        returnedQuery,
        supabase.rpc("get_top_books"),
      ]);

      if (booksRes.error) throw booksRes.error;
      if (usersRes.error) throw usersRes.error;
      if (activeLoansRes.error) throw activeLoansRes.error;
      if (borrowedDataRes.error) throw borrowedDataRes.error;
      if (returnedRes.error) throw returnedRes.error;
      if (topBooksRes.error) throw topBooksRes.error;

      const totalBooks = booksRes.count || 0;
      const totalUsers = usersRes.count || 0;
      const activeLoans = activeLoansRes.count || 0;
      const availableBooks = totalBooks - activeLoans;

      const periodStats = {
        borrowed: borrowedDataRes.data?.length || 0,
        returned: returnedRes.count || 0,
      };

      const chartData = processChartData(borrowedDataRes.data || []);

      const topBooks = processTopBooksLocal(borrowedDataRes.data || []);
      const categoryWinners = processCategoryWinners(
        borrowedDataRes.data || [],
      );

      return {
        stats: { totalBooks, totalUsers, activeLoans, availableBooks },
        periodStats,
        chartData,
        topBooks,
        categoryWinners,
        reportTitle: getReportTitle(timeRange),
      };
    },
    staleTime: 0,
  });

  // --- HELPERS ---
  const getReportTitle = (range) => {
    switch (range) {
      case "month":
        return "Reporte Mensual de Actividad";
      case "week":
        return "Reporte Semanal de Actividad";
      case "today":
        return "Reporte Diario de Actividad";
      default:
        return "Reporte Histórico General";
    }
  };

  const processChartData = (loans) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    loans.forEach((loan) => {
      if (loan.loan_date) {
        const date = new Date(loan.loan_date);
        const dayName = days[date.getDay()];
        if (counts[dayName] !== undefined) counts[dayName]++;
      }
    });
    return Object.keys(counts).map((key) => ({
      name: key,
      loans: counts[key],
    }));
  };

  const processTopBooksLocal = (loans) => {
    const bookCounts = {};
    loans.forEach((loan) => {
      const book = loan.books;
      if (!book) return;
      const id = loan.book_id;
      if (!bookCounts[id]) bookCounts[id] = { ...book, count: 0 };
      bookCounts[id].count++;
    });
    return Object.values(bookCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((book, idx) => ({
        id: idx,
        title: book.title,
        author: book.author,
        category: book.category,
        ranking: idx + 1,
        displayCount: book.count,
      }));
  };

  const processCategoryWinners = (loans) => {
    const categoryMap = {};
    loans.forEach((loan) => {
      const book = loan.books;
      if (!book || !book.category) return;
      const cat = book.category;
      const bookId = loan.book_id;
      if (!categoryMap[cat]) categoryMap[cat] = {};
      if (!categoryMap[cat][bookId])
        categoryMap[cat][bookId] = { ...book, count: 0 };
      categoryMap[cat][bookId].count++;
    });
    return Object.keys(categoryMap).map((category) => {
      const booksInCategory = Object.values(categoryMap[category]);
      const winner = booksInCategory.sort((a, b) => b.count - a.count)[0];
      return { category, ...winner };
    });
  };

  // EXPORT FUNCTION
  const handleExport = (type) => {
    setShowExportMenu(false);
    if (!dashboard) return;

    if (type === "csv") {
      const columns = [
        { header: "Ranking", accessor: "ranking" },
        { header: "Título", accessor: "title" },
        { header: "Total Préstamos", accessor: "displayCount" },
      ];
      const dataToExport = dashboard.topBooks.map((book) => ({
        ranking: `#${book.ranking}`,
        title: book.title,
        displayCount: book.displayCount,
      }));
      exportToCSV(dataToExport, `Data_${timeRange}`, columns);
    } else {
      // Pass periodStats to the PDF
      exportDashboardPDF(
        dashboard.stats,
        dashboard.topBooks,
        dashboard.categoryWinners,
        dashboard.periodStats,
      );
    }
  };

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
  };

  useRealtime("loans", refreshAll);
  useRealtime("books", refreshAll);
  useRealtime("profiles", refreshAll);

  const stats = dashboard?.stats || {
    totalBooks: 0,
    activeLoans: 0,
    availableBooks: 0,
    totalUsers: 0,
  };
  const chartData = dashboard?.chartData || [];
  const topBooks = dashboard?.topBooks || [];
  const categoryWinners = dashboard?.categoryWinners || [];

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

  if (isError)
    return (
      <div className="p-8 text-center text-red-500">
        Error cargando dashboard
      </div>
    );
  if (isLoading)
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );

  return (
    <div className="space-y-8 pb-10">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <p className="text-2xl font-bold text-gray-800">
            {getReportTitle(timeRange)}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
            {["today", "week", "month", "all"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${timeRange === range ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {range === "today"
                  ? "Hoy"
                  : range === "week"
                    ? "Semana"
                    : range === "month"
                      ? "Mes"
                      : "Todo"}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fadeIn">
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  {getReportTitle(timeRange)}
                </div>
                <button
                  onClick={() => handleExport("csv")}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" /> CSV
                  (Datos)
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50"
                >
                  <FileText className="w-4 h-4 text-red-600" /> PDF (Reporte
                  Gerencial)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STATS CARDS */}
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

      {/* CHARTS AND TOP 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-gray-400" />
            Actividad:{" "}
            {timeRange === "all"
              ? "Histórica"
              : timeRange === "month"
                ? "Últimos 30 días"
                : timeRange === "week"
                  ? "Últimos 7 días"
                  : "Hoy"}
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

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">
            Top 5 ({timeRange === "all" ? "Global" : "Del Periodo"})
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
                  <div className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap border border-blue-100">
                    {book.displayCount} prest.
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400 text-sm">
                No hubo actividad en este periodo.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LEADERS BY CATEGORY */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Líderes por Categoría
        </h3>
        {categoryWinners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categoryWinners.map((book, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-shadow"
              >
                <div className="h-32 w-full relative overflow-hidden bg-gray-50">
                  <img
                    src={getCategoryCoverImage(book.category)}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold rounded uppercase tracking-wider mb-1">
                      {book.category}
                    </span>
                    <h4
                      className="text-white font-bold text-sm line-clamp-1"
                      title={book.title}
                    >
                      {book.title}
                    </h4>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <p className="text-xs text-gray-500 truncate flex-1 pr-2">
                    {book.author}
                  </p>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 shrink-0">
                    {book.count} préstamos
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400">
            Aún no hay suficientes datos para determinar líderes por categoría.
          </div>
        )}
      </div>
    </div>
  );
}
