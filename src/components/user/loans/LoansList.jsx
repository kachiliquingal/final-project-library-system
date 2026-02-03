import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import Pagination from "../../common/Pagination";

export default function LoansList({
  isLoading,
  loans,
  activeTab,
  totalPages,
  page,
  onPageChange,
  totalItems,
}) {
  const formatDate = (dateString) => {
    if (!dateString) return "Pendiente";
    return new Date(dateString).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
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
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {loans.map((loan) => (
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

      <div className="mt-8">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={totalItems}
          currentItemsCount={loans.length}
          itemLabel="préstamos"
        />
      </div>
    </>
  );
}
