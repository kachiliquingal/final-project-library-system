import {
  Search,
  Clock,
  Download,
  FileText,
  FileSpreadsheet,
} from "lucide-react";

export default function LoanFilters({
  searchTerm,
  onSearchChange,
  filter,
  onFilterChange,
  showExportMenu,
  setShowExportMenu,
  onExport,
}) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        Historial de Préstamos
      </h2>

      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
        <select
          value={filter}
          onChange={onFilterChange}
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="ALL">Todos</option>
          <option value="ACTIVO">Activos (Pendientes)</option>
          <option value="DEVUELTO">Devueltos</option>
        </select>

        {/* EXPORT BUTTON */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-200"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fadeIn">
              <button
                onClick={() => onExport("csv")}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Descargar CSV
              </button>
              <button
                onClick={() => onExport("pdf")}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50"
              >
                <FileText className="w-4 h-4 text-red-600" />
                Descargar PDF
              </button>
            </div>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por Libro, Estudiante o ID..."
            value={searchTerm}
            onChange={onSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
