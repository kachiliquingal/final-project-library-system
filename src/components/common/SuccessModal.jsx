import { CheckCircle } from "lucide-react";

export default function SuccessModal({ isOpen, message, onClose }) {
  if (!isOpen && !message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          ¡Operación Exitosa!
        </h3>
        <p className="text-gray-500 text-sm mb-6 whitespace-pre-line">
          {message}
        </p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
