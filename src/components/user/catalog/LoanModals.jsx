import { BookOpen } from "lucide-react";

export function ConfirmLoanModal({ book, onConfirm, onCancel, isLoading }) {
  if (!book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center transform transition-all scale-100">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          ¿Solicitar Libro?
        </h3>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Estás a punto de pedir prestado <br />
          <span className="font-bold text-gray-800">"{book.title}"</span>.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 active:scale-95 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
            ) : (
              "Sí, Confirmar Solicitud"
            )}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3.5 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
