import { useState } from "react";
import { supabase } from "../../api/supabaseClient";
import { useRealtime } from "../../hooks/useRealtime";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { exportToCSV, exportDashboardPDF } from "../../utils/reportGenerator";

import DashboardHeader from "../../components/admin/dashboard/DashboardHeader";
import DashboardStatsCards from "../../components/admin/dashboard/DashboardStatsCards";
import ActivityChart from "../../components/admin/dashboard/ActivityChart";
import TopBooksList from "../../components/admin/dashboard/TopBooksList";
import CategoryLeaders from "../../components/admin/dashboard/CategoryLeaders";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [showExportMenu, setShowExportMenu] = useState(false);

  // STATE FOR TIME FILTER
  const [timeRange, setTimeRange] = useState("all");

  const {
    data: dashboard,
    isLoading,
    isError,
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
      let borrowedQuery = supabase
        .from("loans")
        .select("loan_date, status, book_id, books(title, author, category)")
        .order("loan_date", { ascending: false });

      let returnedQuery = supabase
        .from("loans")
        .select("*", { count: "exact", head: true })
        .not("return_date", "is", null);

      if (startDate) {
        borrowedQuery = borrowedQuery.gte("loan_date", startDate);
        returnedQuery = returnedQuery.gte("return_date", startDate);
      }

      // 3. RUN EVERYTHING IN PARALLEL
      const [booksRes, usersRes, activeLoansRes, borrowedDataRes, returnedRes] =
        await Promise.all([
          supabase
            .from("books")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase
            .from("loans")
            .select("*", { count: "exact", head: true })
            .eq("status", "ACTIVO"),
          borrowedQuery,
          returnedQuery,
        ]);

      if (booksRes.error) throw booksRes.error;
      if (usersRes.error) throw usersRes.error;
      if (activeLoansRes.error) throw activeLoansRes.error;
      if (borrowedDataRes.error) throw borrowedDataRes.error;
      if (returnedRes.error) throw returnedRes.error;

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

  // HELPERS (Business Logic)
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

  // Default empty states
  const stats = dashboard?.stats || {
    totalBooks: 0,
    activeLoans: 0,
    availableBooks: 0,
    totalUsers: 0,
  };
  const chartData = dashboard?.chartData || [];
  const topBooks = dashboard?.topBooks || [];
  const categoryWinners = dashboard?.categoryWinners || [];

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
      <DashboardHeader
        title={dashboard.reportTitle}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        showExportMenu={showExportMenu}
        setShowExportMenu={setShowExportMenu}
        onExport={handleExport}
      />

      <DashboardStatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActivityChart chartData={chartData} timeRange={timeRange} />
        <TopBooksList topBooks={topBooks} timeRange={timeRange} />
      </div>

      <CategoryLeaders categoryWinners={categoryWinners} />
    </div>
  );
}
