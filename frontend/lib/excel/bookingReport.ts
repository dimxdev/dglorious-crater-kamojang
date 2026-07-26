// Generator Excel (.xlsx) buat laporan Data Booking Admin — pakai ExcelJS
// (bukan `xlsx`/SheetJS versi gratis, yang nyaris gak bisa styling) supaya
// hasilnya beneran "menarik": header bermerek, warna brand Admin, kolom Total
// & Jumlah tetap angka asli (bukan teks) biar bisa dijumlah/diurutkan
// langsung di Excel, plus autofilter & freeze header.
import ExcelJS from 'exceljs';

const DARK = 'FF14352A';
const ACCENT = 'FFC15F1E';
const FOREST = 'FF1B4332';
const CREAM = 'FFF4F1EA';
const CREAM_BORDER = 'FFE2DCCB';
const TEXT_MUTED = 'FF8A8274';
const WHITE = 'FFFFFFFF';

function hexToArgb(hex: string): string {
  return `FF${hex.replace('#', '').toUpperCase()}`;
}

function thinBorder() {
  const side = { style: 'thin' as const, color: { argb: CREAM_BORDER } };
  return { top: side, bottom: side, left: side, right: side };
}

export type BookingExcelStat = { label: string; value: string };
export type BookingExcelBreakdownRow = { label: string; count: number; pct: number; colorHex: string };
export type BookingExcelBreakdown = { title: string; rows: BookingExcelBreakdownRow[] };
export type BookingExcelRow = {
  kode: string;
  guest: string;
  wa: string;
  unit: string;
  bookingDate: string;
  checkIn: string;
  checkOut: string;
  source: string;
  total: number;
  status: string;
  statusColorHex: string;
};

export async function exportBookingExcel(input: {
  sheetName: string;
  title: string;
  companyName: string;
  periodLabel: string;
  generatedLabel: string;
  statsSectionTitle: string;
  stats: BookingExcelStat[];
  breakdowns: BookingExcelBreakdown[];
  tableSectionTitle: string;
  headers: string[];
  rows: BookingExcelRow[];
  noDataText: string;
  fileName: string;
}): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = input.companyName;
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(input.sheetName);
  const colCount = input.headers.length;

  const fillRow = (rowIdx: number, argb: string) => {
    for (let c = 1; c <= colCount; c++) {
      sheet.getCell(rowIdx, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
    }
  };

  // ---- Header brand (3 baris merge penuh) ----
  sheet.mergeCells(1, 1, 1, colCount);
  sheet.getCell(1, 1).value = input.companyName.toUpperCase();
  sheet.getCell(1, 1).font = { bold: true, size: 10, color: { argb: ACCENT } };
  fillRow(1, DARK);
  sheet.getRow(1).height = 18;

  sheet.mergeCells(2, 1, 2, colCount);
  sheet.getCell(2, 1).value = input.title;
  sheet.getCell(2, 1).font = { bold: true, size: 16, color: { argb: WHITE } };
  fillRow(2, DARK);
  sheet.getRow(2).height = 26;

  sheet.mergeCells(3, 1, 3, colCount);
  sheet.getCell(3, 1).value = `${input.periodLabel}   •   ${input.generatedLabel}`;
  sheet.getCell(3, 1).font = { italic: true, size: 9, color: { argb: 'FFE1DBCE' } };
  fillRow(3, DARK);
  sheet.getRow(3).height = 16;

  // Judul section (Ringkasan Angka/Distribusi Status/dst) — bold + garis bawah
  // tipis warna aksen, biar ada pemisah visual yang jelas antar section.
  const sectionTitle = (r: number, text: string) => {
    const cell = sheet.getCell(r, 1);
    cell.value = text;
    cell.font = { bold: true, size: 12 };
    cell.border = { bottom: { style: 'thin', color: { argb: ACCENT } } };
  };

  let row = 5;

  // ---- Ringkasan angka ----
  sectionTitle(row, input.statsSectionTitle);
  row += 1;
  input.stats.forEach((s) => {
    sheet.getRow(row).height = 16;
    sheet.getCell(row, 1).value = s.label;
    sheet.getCell(row, 1).font = { color: { argb: TEXT_MUTED } };
    sheet.getCell(row, 2).value = s.value;
    sheet.getCell(row, 2).font = { bold: true, color: { argb: FOREST } };
    row += 1;
  });
  row += 1;

  // ---- Breakdown (status & sumber) ----
  input.breakdowns.forEach((b) => {
    sectionTitle(row, b.title);
    row += 1;
    b.rows.forEach((r) => {
      sheet.getRow(row).height = 16;
      const swatch = sheet.getCell(row, 1);
      swatch.value = '■';
      swatch.font = { color: { argb: hexToArgb(r.colorHex) } };
      sheet.getCell(row, 2).value = r.label;
      const countCell = sheet.getCell(row, 3);
      countCell.value = r.count;
      countCell.font = { bold: true };
      const pctCell = sheet.getCell(row, 4);
      pctCell.value = r.pct / 100;
      pctCell.numFmt = '0%';
      pctCell.font = { color: { argb: TEXT_MUTED } };
      row += 1;
    });
    row += 1;
  });

  // ---- Tabel detail booking ----
  sectionTitle(row, input.tableSectionTitle);
  row += 1;

  const headerRow = row;
  input.headers.forEach((h, i) => {
    const cell = sheet.getCell(headerRow, i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = thinBorder();
  });
  sheet.getRow(headerRow).height = 20;
  row += 1;

  if (input.rows.length === 0) {
    sheet.mergeCells(row, 1, row, colCount);
    sheet.getCell(row, 1).value = input.noDataText;
    sheet.getCell(row, 1).font = { color: { argb: TEXT_MUTED } };
    row += 1;
  } else {
    input.rows.forEach((r, i) => {
      const values = [
        r.kode,
        r.guest,
        r.wa,
        r.unit,
        r.bookingDate,
        r.checkIn,
        r.checkOut,
        r.source,
        r.total,
        r.status,
      ];
      values.forEach((v, ci) => {
        const cell = sheet.getCell(row, ci + 1);
        cell.value = v;
        cell.border = thinBorder();
        if (i % 2 === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CREAM } };
        }
        if (ci === 8) {
          cell.numFmt = '"Rp" #,##0';
          cell.font = { bold: true };
        }
        if (ci === 9) {
          cell.font = { bold: true, color: { argb: hexToArgb(r.statusColorHex) } };
        }
      });
      row += 1;
    });
  }

  // Autofilter + freeze header row biar tetap keliatan pas scroll panjang.
  // Spec lengkap (xSplit/topLeftCell/activeCell) sengaja diisi semua — kalau
  // cuma `state`+`ySplit` beberapa viewer (bukan Excel desktop) salah render
  // panenya dan malah jadi kekunci gak bisa di-scroll ke bawah sama sekali.
  sheet.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: colCount } };
  sheet.views = [
    {
      state: 'frozen',
      xSplit: 0,
      ySplit: headerRow,
      topLeftCell: `A${headerRow + 1}`,
      activeCell: `A${headerRow + 1}`,
      showGridLines: false,
    },
  ];

  // Kolom A/B dipakai dobel (kode/tamu di tabel, tapi juga label/nilai di
  // Ringkasan & Distribusi) — dilebarin biar label terpanjang ("Distribusi
  // Status", "Total Pendapatan") gak kepotong visual.
  const widths = [24, 22, 16, 26, 13, 13, 13, 12, 15, 13];
  widths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = input.fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
