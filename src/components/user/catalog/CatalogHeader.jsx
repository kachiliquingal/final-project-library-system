import { Search } from "lucide-react";

export default function CatalogHeader({ searchTerm, onSearchChange }) {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center space-y-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

      <div>
        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
          Biblioteca Digital
        </h2>
        <p className="text-gray-500 mt-2">
          Explora nuestro catálogo y reserva tu próximo libro.
        </p>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por título, autor o categoría..."
          value={searchTerm}
          onChange={onSearchChange}
          className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-lg shadow-sm"
        />
      </div>
    </div>
  );
}
