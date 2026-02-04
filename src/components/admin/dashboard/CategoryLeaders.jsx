import { Trophy } from "lucide-react";
import { getCategoryCoverImage } from "../../../utils/bookCoverHelper";

export default function CategoryLeaders({ categoryWinners }) {
  return (
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
  );
}
