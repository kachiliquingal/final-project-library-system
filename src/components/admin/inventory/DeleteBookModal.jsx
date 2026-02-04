import { TriangleAlert } from "lucide-react";

export default function DeleteBookModal({
  isOpen,
  onClose,
  onConfirm,
  bookTitle,
  isLoading,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TriangleAlert className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar libro?</h3>
        <p className="text-gray-500 text-sm mb-6">
          Estás a punto de eliminar <strong>"{bookTitle}"</strong>. <br />
          <span className="text-gray-400 font-medium text-xs mt-2 block">
            (El historial de préstamos se conservará, pero el libro ya no aparecerá en
            el inventario activo).
          </span>
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
            ) : (
              "Sí, Eliminar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}