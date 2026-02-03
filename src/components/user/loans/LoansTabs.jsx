import { Download } from "lucide-react";

export default function LoansTabs({
  activeTab,
  onTabChange,
  showExportButton,
  onExport,
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-end border-b border-gray-200 gap-4">
      <div className="flex w-full sm:w-auto">
        <button
          onClick={() => onTabChange("active")}
          className={`pb-4 px-6 text-sm font-medium transition-all relative ${
            activeTab === "active"
              ? "text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Préstamos Activos
          {activeTab === "active" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>
          )}
        </button>
        <button
          onClick={() => onTabChange("history")}
          className={`pb-4 px-6 text-sm font-medium transition-all relative ${
            activeTab === "history"
              ? "text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Historial de Devoluciones
          {activeTab === "history" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>
          )}
        </button>
      </div>

      {showExportButton && (
        <button
          onClick={onExport}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary mb-3 px-2 transition-colors"
          title="Descargar comprobante en PDF"
        >
          <Download className="w-4 h-4" />
          <span className="font-medium">Descargar Reporte</span>
        </button>
      )}
    </div>
  );
}
