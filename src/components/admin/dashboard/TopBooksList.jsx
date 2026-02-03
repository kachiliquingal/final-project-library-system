export default function TopBooksList({ topBooks, timeRange }) {
  return (
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
                <p className="text-xs text-gray-500 truncate">{book.author}</p>
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
  );
}
