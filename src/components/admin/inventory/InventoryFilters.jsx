import { Search, Plus, Download, FileText, FileSpreadsheet } from "lucide-react";

export default function InventoryFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange,
  showExportMenu,
  setShowExportMenu,
  onExport,
  onOpenCreate,
}) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por título, autor..."
          value={searchTerm}
          onChange={onSearchChange}
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      <div className="flex gap-3 w-full md:w-auto items-center">
        <select
          value={filterStatus}
          onChange={onFilterChange}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="ALL">Todos los Estados</option>
          <option value="DISPONIBLE">Disponibles</option>
          <option value="PRESTADO">Prestados</option>
        </select>

        {/* EXPORT BUTTON & DROPDOWN */}
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

        <button
          onClick={onOpenCreate}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo Libro</span>
        </button>
      </div>
    </div>
  );
}