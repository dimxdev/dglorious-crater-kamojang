// Generator PDF laporan — dibangun terprogram (bukan screenshot halaman) via
// jsPDF + jspdf-autotable, supaya teksnya tajam & gampang dibaca, bukan hasil
// raster yang buram. Semua teks/label dikirim sudah diterjemahkan dari
// pemanggil (komponen React yang punya akses `t()`) — file ini murni layout,
// sengaja tidak bergantung ke i18n biar tetap reusable & gampang ditest.
// Dipakai bareng oleh dashboard Owner (Ringkasan/Penginapan) & Admin (Data
// Booking) — warna brand tiap dashboard beda (`theme`), tapi polanya
// (header band, stat card, breakdown, tabel, footer bernomor halaman) sama.
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const TEXT_MUTED: [number, number, number] = [138, 130, 116];
const TEXT_DARK: [number, number, number] = [40, 35, 30];
const GREEN_UP: [number, number, number] = [47, 107, 65];
const RED_DOWN: [number, number, number] = [178, 59, 48];
const ACCENT_TEXT: [number, number, number] = [138, 109, 31];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Palet warna brand — beda per dashboard (Owner: dark+gold, Admin: dark green+terracotta). */
export type ReportTheme = {
  darkHex: string;
  accentHex: string;
  forestHex: string;
  creamHex: string;
  creamBorderHex: string;
};

export type ReportStat = {
  label: string;
  value: string;
  deltaText: string;
  deltaTone: 'up' | 'down' | 'neutral';
};

/** Satu baris breakdown (legenda donut versi PDF) — label + persentase + colorHex. */
export type ReportBreakdownRow = {
  label: string;
  pct: number;
  valueText: string;
  colorHex: string;
};

export type ReportBreakdown = {
  title: string;
  rows: ReportBreakdownRow[];
};

/** Tabel data generik (dipakai buat "Detail Booking", "Performa per Tipe Tenda", dst). */
export type ReportTable = {
  sectionTitle: string;
  headers: string[];
  rows: string[][];
  noDataText: string;
  /** Indeks kolom (0-based) yang rata kanan + tebal, biasanya kolom nominal. */
  rightAlignColumns?: number[];
};

export type ReportLabels = {
  documentTitle: string;
  reportTitle: string;
  companyName: string;
  periodLabel: string;
  generatedLabel: string;
  statsSectionTitle: string;
  footerNote: string;
  pageLabel: (page: number, total: number) => string;
};

/** Tema warna dashboard Owner — dark brown + gold, sama kayak `OwnerLayout.tsx`. */
export const OWNER_REPORT_THEME: ReportTheme = {
  darkHex: '#1a1410',
  accentHex: '#D4A04A',
  forestHex: '#1B4332',
  creamHex: '#f4f1ea',
  creamBorderHex: '#e6dfd0',
};

/** Tema warna dashboard Admin — dark green + terracotta, sama kayak `Sidebar.tsx`. */
export const ADMIN_REPORT_THEME: ReportTheme = {
  darkHex: '#14352A',
  accentHex: '#c15f1e',
  forestHex: '#1B4332',
  creamHex: '#f4f1ea',
  creamBorderHex: '#e2dccb',
};

export function exportReportPdf(input: {
  theme: ReportTheme;
  stats: ReportStat[];
  breakdowns: ReportBreakdown[];
  table: ReportTable;
  labels: ReportLabels;
  fileName: string;
  /** 'landscape' buat tabel yang kolomnya banyak/lebar (mis. Data Booking Admin,
   *  10 kolom) — biar gak sumpek/wrap parah kayak di potret. Default 'portrait'. */
  orientation?: 'portrait' | 'landscape';
}): void {
  const { stats, breakdowns, table, labels, fileName, orientation = 'portrait' } = input;
  const DARK = hexToRgb(input.theme.darkHex);
  const ACCENT = hexToRgb(input.theme.accentHex);
  const FOREST = hexToRgb(input.theme.forestHex);
  const CREAM = hexToRgb(input.theme.creamHex);
  const CREAM_BORDER = hexToRgb(input.theme.creamBorderHex);

  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
  doc.setProperties({ title: labels.documentTitle });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // ---- Header band ----
  const headerHeight = 92;
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  doc.setFillColor(...ACCENT);
  doc.rect(0, headerHeight, pageWidth, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text(labels.reportTitle, margin, 38);

  doc.setTextColor(...ACCENT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(labels.companyName.toUpperCase(), margin, 56);

  doc.setTextColor(225, 219, 206);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(labels.periodLabel, pageWidth - margin, 36, { align: 'right' });
  doc.text(labels.generatedLabel, pageWidth - margin, 50, { align: 'right' });

  let y = headerHeight + 30;

  // ---- Stat cards (grid 2 kolom, jumlah baris ikut panjang `stats`) ----
  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(labels.statsSectionTitle, margin, y);
  y += 14;

  const cardGap = 12;
  const cardW = (contentWidth - cardGap) / 2;
  const cardH = 58;
  stats.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * (cardW + cardGap);
    const cardY = y + row * (cardH + cardGap);

    doc.setDrawColor(...CREAM_BORDER);
    doc.setFillColor(...CREAM);
    doc.roundedRect(x, cardY, cardW, cardH, 6, 6, 'FD');

    doc.setTextColor(...TEXT_MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(s.label, x + 14, cardY + 18);

    doc.setTextColor(...FOREST);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(s.value, x + 14, cardY + 38);

    if (s.deltaText) {
      const tone = s.deltaTone === 'up' ? GREEN_UP : s.deltaTone === 'down' ? RED_DOWN : ACCENT_TEXT;
      doc.setTextColor(...tone);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(s.deltaText, x + 14, cardY + 50);
    }
  });
  const statRows = Math.ceil(stats.length / 2);
  y += statRows * cardH + (statRows - 1) * cardGap + 28;

  // ---- Breakdown (legenda donut versi teks) — bisa lebih dari satu section ----
  breakdowns.forEach((b) => {
    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(b.title, margin, y);
    y += 16;

    b.rows.forEach((row) => {
      doc.setFillColor(...hexToRgb(row.colorHex));
      doc.roundedRect(margin, y - 8, 9, 9, 2, 2, 'F');

      doc.setTextColor(...TEXT_DARK);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(row.label, margin + 16, y);

      doc.setFont('helvetica', 'bold');
      doc.text(`${row.pct}%`, margin + 220, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_MUTED);
      doc.text(row.valueText, pageWidth - margin, y, { align: 'right' });

      y += 18;
    });
    y += 14;
  });

  // ---- Tabel detail (generik: booking, performa per tipe tenda, dst) ----
  // Selalu mulai di halaman baru — halaman 1 murni ringkasan/breakdown,
  // halaman 2 dst. tabel detail, biar gak numpuk/kepotong di tengah halaman 1.
  doc.addPage();
  y = margin + 20;

  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(table.sectionTitle, margin, y);
  y += 10;

  if (table.rows.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(table.noDataText, margin, y + 16);
  } else {
    const columnStyles: Record<number, { halign: 'right'; fontStyle: 'bold' }> = {};
    (table.rightAlignColumns ?? []).forEach((i) => {
      columnStyles[i] = { halign: 'right', fontStyle: 'bold' };
    });
    autoTable(doc, {
      startY: y + 8,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [table.headers],
      body: table.rows,
      styles: { font: 'helvetica', fontSize: 8.5, textColor: TEXT_DARK, lineColor: CREAM_BORDER, lineWidth: 0.5 },
      headStyles: { fillColor: DARK, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      alternateRowStyles: { fillColor: CREAM },
      columnStyles,
    });
  }

  // ---- Footer (semua halaman) ----
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(...CREAM_BORDER);
    doc.line(margin, pageHeight - 34, pageWidth - margin, pageHeight - 34);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(labels.footerNote, margin, pageHeight - 20);
    doc.text(labels.pageLabel(p, pageCount), pageWidth - margin, pageHeight - 20, { align: 'right' });
  }

  doc.save(fileName);
}
