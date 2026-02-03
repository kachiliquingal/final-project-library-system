import {
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
} from "lucide-react";
import { getCategoryCoverImage } from "../../../utils/bookCoverHelper";

export default function BookGrid({
  isLoading,
  books,
  totalBooks,
  page,
  totalPages,
  onPageChange,
  onRequestLoan,
  loadingLoanId,
}) {
  return (
    <section>
      <div className="flex flex-col sm:flex-row justify-between items-end mb-6 gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Catálogo General</h3>
          <p className="text-sm text-gray-500 mt-1">
            {isLoading ? "Cargando..." : `${totalBooks} libros disponibles`}
          </p>
        </div>

        {totalPages > 1 && (
          <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-all text-gray-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center px-2 text-sm font-medium text-gray-600">
              {page} / {totalPages}
            </div>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-all text-gray-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-96 bg-gray-200 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group h-full"
            >
              {/* BOOK COVER */}
              <div className="h-56 relative bg-gray-100 overflow-hidden">
                <img
                  src={book.cover_url || getCategoryCoverImage(book.category)}
                  alt={book.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />

                {/* STATUS BADGE OVERLAY */}
                <div className="absolute top-3 right-3 z-10">
                  {book.status === "DISPONIBLE" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur text-emerald-700 shadow-sm uppercase tracking-wide">
                      <CheckCircle className="w-3 h-3" /> Disponible
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur text-orange-700 shadow-sm uppercase tracking-wide">
                      <Clock className="w-3 h-3" /> Prestado
                    </span>
                  )}
                </div>
              </div>

              {/* INFO */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex-1 mb-4">
                  <h3
                    className="text-gray-900 font-bold text-lg leading-tight line-clamp-2 mb-2"
                    title={book.title}
                  >
                    {book.title}
                  </h3>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <p className="text-gray-500 text-sm font-medium truncate">
                      {book.author}
                    </p>
                  </div>

                  <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-md uppercase tracking-wide">
                    {book.category || "General"}
                  </span>
                </div>

                {/* ACTION BUTTON */}
                <div className="mt-auto pt-4 border-t border-gray-50">
                  <button
                    onClick={() => onRequestLoan(book)}
                    disabled={
                      book.status !== "DISPONIBLE" || loadingLoanId === book.id
                    }
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 border border-transparent
                      ${
                        book.status === "DISPONIBLE"
                          ? "bg-gray-900 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-95"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    {loadingLoanId === book.id ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                    ) : book.status === "DISPONIBLE" ? (
                      "Solicitar Préstamo"
                    ) : (
                      "No Disponible"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            No encontramos libros
          </h3>
          <p className="text-gray-500 mt-2">Intenta ajustar tu búsqueda.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-12 flex justify-center">
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all text-gray-600"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="px-6 text-base font-semibold text-gray-700">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all text-gray-600"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
