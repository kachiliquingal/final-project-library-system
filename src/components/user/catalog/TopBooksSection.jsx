import { TrendingUp, Star } from "lucide-react";
import { getCategoryCoverImage } from "../../../utils/bookCoverHelper";

export default function TopBooksSection({ topBooks, onRequestLoan }) {
  if (!topBooks || topBooks.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800">
          Los Más Solicitados
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {topBooks.map((book, idx) => (
          <div
            key={book.id}
            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all border border-gray-100 overflow-hidden cursor-pointer flex flex-col h-full"
          >
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur text-gray-800 text-xs font-bold px-2 py-1 rounded-md shadow-sm z-10 flex items-center gap-1 border border-gray-100">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> Top{" "}
              {idx + 1}
            </div>

            <div className="h-48 w-full relative overflow-hidden bg-gray-100">
              <img
                src={book.cover_url || getCategoryCoverImage(book.category)}
                alt={book.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            <div className="p-4 flex flex-col flex-1">
              <h4
                className="font-bold text-gray-800 text-sm line-clamp-2 mb-1"
                title={book.title}
              >
                {book.title}
              </h4>
              <p className="text-xs text-gray-500 truncate mb-4">
                {book.author}
              </p>

              <div className="mt-auto">
                <button
                  onClick={() => onRequestLoan(book)}
                  disabled={book.status !== "DISPONIBLE"}
                  className={`w-full py-2 text-xs font-bold rounded-xl transition-all shadow-sm border border-transparent
                    ${
                      book.status === "DISPONIBLE"
                        ? "bg-gray-900 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-95"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100"
                    }`}
                >
                  {book.status === "DISPONIBLE" ? "Solicitar" : "Ocupado"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
