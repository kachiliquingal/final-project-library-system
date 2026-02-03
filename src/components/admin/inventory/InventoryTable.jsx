import { Edit, Trash2, BookOpen } from "lucide-react";
import Pagination from "../../common/Pagination";

export default function InventoryTable({
  isLoading,
  books,
  totalCount,
  page,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4 w-1/3">Libro</th>
              <th className="px-6 py-4">Autor</th>
              <th className="px-6 py-4">Categoría</th>
              <th className="px-6 py-4 text-center">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-10 text-center text-gray-400"
                >
                  <div className="flex justify-center items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Cargando catálogo...
                  </div>
                </td>
              </tr>
            ) : books.length > 0 ? (
              books.map((book) => (
                <tr
                  key={book.id}
                  className="hover:bg-gray-50 transition-colors group"
                >
                  <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                    #{book.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-800 text-sm leading-snug">
                        {book.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {book.author}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {book.category || "General"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        book.status === "DISPONIBLE"
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {book.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(book)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(book)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-10 text-center text-gray-400 italic"
                >
                  No se encontraron libros.
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
        totalItems={totalCount}
        currentItemsCount={books.length}
        itemLabel="libros"
      />
    </div>
  );
}
