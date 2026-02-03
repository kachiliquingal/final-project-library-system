import { X, Save } from "lucide-react";

export default function BookFormModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onInputChange,
  isEditing,
  isLoading,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 text-lg">
            {isEditing ? "Editar Libro" : "Agregar Nuevo Libro"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título del Libro
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={onInputChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Ej: Clean Code"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Autor
            </label>
            <input
              type="text"
              name="author"
              value={formData.author}
              onChange={onInputChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Ej: Robert C. Martin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={onInputChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Ej: Programación"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-800 font-medium transition-colors flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" /> {isEditing ? "Actualizar" : "Guardar"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}