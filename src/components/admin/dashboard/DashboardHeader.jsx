import { Download, FileText, FileSpreadsheet } from "lucide-react";

export default function DashboardHeader({
  title,
  timeRange,
  onTimeRangeChange,
  showExportMenu,
  setShowExportMenu,
  onExport,
}) {
  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <div>
        <p className="text-2xl font-bold text-gray-800">{title}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* TIME FILTER BUTTONS */}
        <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
          {["today", "week", "month", "all"].map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                timeRange === range
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {range === "today"
                ? "Hoy"
                : range === "week"
                  ? "Semana"
                  : range === "month"
                    ? "Mes"
                    : "Todo"}
            </button>
          ))}
        </div>

        {/* EXPORT BUTTON & MENU */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fadeIn">
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                {title}
              </div>
              <button
                onClick={() => onExport("csv")}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" /> CSV
                (Datos)
              </button>
              <button
                onClick={() => onExport("pdf")}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50"
              >
                <FileText className="w-4 h-4 text-red-600" /> PDF (Reporte
                Gerencial)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
