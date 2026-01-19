import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// CSV
export const exportToCSV = (data, filename, columns) => {
  if (!data || !data.length) {
    alert("No hay datos para exportar.");
    return;
  }

  const headers = columns.map((col) => col.header).join(",");
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        let cell = row[col.accessor];
        cell = cell === null || cell === undefined ? "" : cell;
        cell = cell.toString().replace(/"/g, '""');
        return `"${cell}"`;
      })
      .join(",");
  });

  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${filename}_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// PDF - Simple Tables
export const exportToPDF = (data, title, columns, orientation = "portrait") => {
  const doc = new jsPDF(orientation, "mm", "a4");
  addHeader(doc, title);

  const tableHeaders = columns.map((col) => col.header);
  const tableBody = data.map((row) => columns.map((col) => row[col.accessor]));

  autoTable(doc, {
    head: [tableHeaders],
    body: tableBody,
    startY: 45,
    theme: "grid",
    headStyles: {
      fillColor: [0, 54, 102],
      textColor: 255,
      fontSize: 10,
      fontStyle: "bold",
    },
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  savePDF(doc, title);
};

// DASHBOARD REPORT GENERATOR - Comprehensive Managerial Report
export const exportDashboardPDF = (
  stats,
  topBooks,
  categoryWinners,
  periodStats,
) => {
  const doc = new jsPDF("portrait", "mm", "a4");

  addHeader(doc, "Reporte General del Sistema");

  doc.setFontSize(14);
  doc.setTextColor(0, 54, 102);
  doc.text("1. Estado del Inventario y Usuarios", 14, 50);

  autoTable(doc, {
    startY: 55,
    head: [
      [
        "Total Libros",
        "Préstamos Activos (Global)",
        "Libros Disponibles",
        "Usuarios Registrados",
      ],
    ],
    body: [
      [
        stats.totalBooks,
        stats.activeLoans,
        stats.availableBooks,
        stats.totalUsers,
      ],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [50, 50, 50],
      halign: "center",
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      textColor: [0, 54, 102],
      halign: "center",
      fontSize: 12,
      fontStyle: "bold",
    },
  });

  let finalY = doc.lastAutoTable.finalY || 55;
  doc.setFontSize(14);
  doc.setTextColor(0, 54, 102);
  doc.text("2. Top 5 - Libros Más Solicitados", 14, finalY + 15);

  const topHeaders = ["Ranking", "Título", "Autor", "Categoría", "Préstamos"];
  const topBody = topBooks.map((book) => [
    `#${book.ranking}`,
    book.title,
    book.author,
    book.category,
    book.displayCount,
  ]);

  autoTable(doc, {
    startY: finalY + 20,
    head: [topHeaders],
    body: topBody,
    theme: "grid",
    headStyles: { fillColor: [0, 54, 102] },
    styles: { fontSize: 9 },
  });

  finalY = doc.lastAutoTable.finalY;

  if (finalY > 200) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(0, 54, 102);
  doc.text("3. Líderes por Categoría", 14, finalY + 15);

  const catHeaders = ["Categoría", "Libro Líder", "Autor", "Total Préstamos"];
  const catBody = categoryWinners.map((book) => [
    book.category,
    book.title,
    book.author,
    book.count,
  ]);

  autoTable(doc, {
    startY: finalY + 20,
    head: [catHeaders],
    body: catBody,
    theme: "striped",
    headStyles: { fillColor: [255, 193, 7], textColor: [50, 50, 50] },
    styles: { fontSize: 9 },
  });

  finalY = doc.lastAutoTable.finalY;

  if (finalY > 220) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(0, 54, 102);
  doc.text("4. Balance del Periodo Seleccionado", 14, finalY + 15);

  autoTable(doc, {
    startY: finalY + 20,
    head: [["Concepto", "Cantidad", "Detalle"]],
    body: [
      [
        "Nuevos Préstamos",
        periodStats.borrowed,
        "Libros entregados en este periodo",
      ],
      [
        "Devoluciones",
        periodStats.returned,
        "Libros reingresados al inventario",
      ],
      [
        "Flujo Total",
        periodStats.borrowed + periodStats.returned,
        "Total de transacciones procesadas",
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [40, 167, 69], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { halign: "center", fontStyle: "bold", fontSize: 12, cellWidth: 30 },
      2: { fontStyle: "italic" },
    },
  });

  savePDF(doc, "Reporte_Gerencial_Dashboard");
};

// Internal Helpers
const addHeader = (doc, title) => {
  const today = new Date().toLocaleDateString("es-EC", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text("Sistema Bibliotecario UCE", 14, 22);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(title, 14, 30);

  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generado el: ${today}`, 14, 36);

  doc.setDrawColor(200, 200, 200);
  doc.line(14, 40, 196, 40);
};

const savePDF = (doc, prefix) => {
  doc.save(`${prefix.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.pdf`);
};
