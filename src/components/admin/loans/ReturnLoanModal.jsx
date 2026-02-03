import { AlertCircle, RotateCcw } from "lucide-react";

export default function ReturnLoanModal({
  isOpen,
  onClose,
  onConfirm,
  loan,
  isLoading,
}) {
  if (!isOpen || !loan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          ¿Confirmar Devolución?
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Estás a punto de cerrar el ticket <strong>#{loan.id}</strong>.
          <br />
          El libro <strong>"{loan.books?.title}"</strong> volverá al inventario.
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" /> Confirmar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
