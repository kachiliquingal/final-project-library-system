import {
  Hash,
  ArrowDown,
  ArrowUp,
  BookOpen,
  User,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import Pagination from "../../common/Pagination";

export default function LoansTable({
  isLoading,
  loans,
  totalItems,
  page,
  totalPages,
  onPageChange,
  sortOrder,
  onToggleSort,
  onReturnClick,
  isReturnLoading,
}) {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
              <th className="px-6 py-4 w-16 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Hash className="w-3 h-3" /> ID
                </div>
              </th>
              <th className="px-6 py-4 w-1/3">Libro</th>
              <th className="px-6 py-4">Estudiante</th>
              <th
                className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors group select-none"
                onClick={onToggleSort}
                title="Clic para cambiar orden"
              >
                <div className="flex items-center gap-1">
                  Fecha Préstamo
                  {sortOrder === "desc" ? (
                    <ArrowDown className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <ArrowUp className="w-3.5 h-3.5 text-primary" />
                  )}
                </div>
              </th>
              <th className="px-6 py-4">Fecha Devolución</th>
              <th className="px-6 py-4 text-center">Estado</th>
              <th className="px-6 py-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-10 text-center text-gray-400"
                >
                  <div className="flex justify-center items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Cargando historial...
                  </div>
                </td>
              </tr>
            ) : loans.length > 0 ? (
              loans.map((loan) => (
                <tr
                  key={loan.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-xs font-mono font-bold text-gray-400 text-center">
                    #{loan.id}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-50 p-2 rounded-lg text-orange-600 mt-1 shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm leading-snug">
                          {loan.books?.title || "Libro eliminado"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {loan.books?.author && (
                            <span className="font-medium">
                              {loan.books.author}
                            </span>
                          )}
                          {loan.books?.author && loan.books?.category && " • "}
                          {loan.books?.category || "General"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top pt-5">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {loan.profiles?.full_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {loan.profiles?.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 align-top pt-5">
                    {formatDate(loan.loan_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 align-top pt-5">
                    {loan.return_date ? formatDate(loan.return_date) : "-"}
                  </td>
                  <td className="px-6 py-4 text-center align-top pt-5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        loan.status === "ACTIVO"
                          ? "bg-purple-50 text-purple-700 border-purple-100"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {loan.status === "ACTIVO" ? "En Curso" : "Devuelto"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right align-top pt-5">
                    {loan.status === "ACTIVO" && (
                      <button
                        onClick={() => onReturnClick(loan)}
                        disabled={isReturnLoading}
                        className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1 rounded-md transition-colors shadow-sm flex items-center gap-1 ml-auto disabled:opacity-50"
                      >
                        <RotateCcw className="w-3 h-3" /> Devolver
                      </button>
                    )}
                    {loan.status === "DEVUELTO" && (
                      <span className="text-xs text-green-600 flex items-center justify-end gap-1">
                        <CheckCircle className="w-3 h-3" /> Completado
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-10 text-center text-gray-400 italic"
                >
                  No hay registros coinciden con tu búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        totalItems={totalItems}
        currentItemsCount={loans.length}
        itemLabel="registros"
      />
    </div>
  );
}
