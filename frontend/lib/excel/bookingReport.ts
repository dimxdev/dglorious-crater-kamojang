// Generator Excel (.xlsx) buat laporan Data Booking Admin — pakai ExcelJS
// (bukan `xlsx`/SheetJS versi gratis, yang nyaris gak bisa styling) supaya
// hasilnya beneran rapi: header bermerek, warna brand Admin, angka tetap
// disimpan sebagai number (bukan teks) biar bisa dijumlah/diurutkan di Excel.
//
// PENTING — kenapa dipecah 2 sheet ("Ringkasan" + "Detail Booking"):
// versi pertama naruh blok ringkasan DI ATAS tabel dalam satu sheet, lalu
// freeze pane di baris header tabel. Masalahnya header tabel jatuh di baris
// ~24, jadi `ySplit=24` mengunci 24 baris teratas — hampir seluruh tinggi
// jendela Excel — dan yang bisa di-scroll cuma sisa beberapa baris. Efeknya
// kelihatan seperti "gak bisa scroll ke bawah". Freeze pane cuma masuk akal
// kalau header tabelnya dekat baris 1, makanya tabel dipisah ke sheet sendiri.
import ExcelJS from 'exceljs';

const DARK = 'FF14352A';
const ACCENT = 'FFC15F1E';
const FOREST = 'FF1B4332';
const ZEBRA = 'FFF9F7F2';
const CREAM_BORDER = 'FFE2DCCB';
const TEXT_DARK = 'FF2B2721';
const TEXT_MUTED = 'FF8A8274';
const WHITE = 'FFFFFFFF';
const SUBTLE = 'FFE1DBCE';
/** Warna "meja kerja" di luar area konten — gridline dimatikan, jadi kalau
 *  dibiarkan putih polos batas laporannya gak keliatan sama sekali. */
const CANVAS = 'FFE8E3D9';

function hexToArgb(hex: string): string {
  return `FF${hex.replace('#', '').toUpperCase()}`;
}

function solid(argb: string): ExcelJS.FillPattern {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const side = { style: 'thin' as const, color: { argb: CREAM_BORDER } };
  return { top: side, bottom: side, left: side, right: side };
}

/** Nama sheet Excel: maks 31 karakter & gak boleh mengandung : \ / ? * [ ] */
function safeSheetName(name: string): string {
  return name.replace(/[:\\/?*[\]]/g, ' ').trim().slice(0, 31);
}

export type BookingExcelStat = {
  label: string;
  value: number | string;
  /** Format angka Excel (mis. Rupiah). Kalau `value` number, ini yang dipakai. */
  numFmt?: string;
};
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
  summarySheetName: string;
  detailSheetName: string;
  title: string;
  companyName: string;
  periodLabel: string;
  generatedLabel: string;
  statsSectionTitle: string;
  stats: BookingExcelStat[];
  breakdowns: BookingExcelBreakdown[];
  tableSectionTitle: string;
  totalLabel: string;
  headers: string[];
  rows: BookingExcelRow[];
  noDataText: string;
  footerNote: string;
  fileName: string;
}): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = input.companyName;
  workbook.created = new Date();

  const colCount = input.headers.length;
  const TOTAL_COL = 9; // kolom "Total" (1-based) — dipakai buat numFmt & SUM

  /** Cat area "meja kerja" di luar kartu konten biar batas laporan keliatan. */
  const paintCanvas = (sheet: ExcelJS.Worksheet, lastRow: number, lastCol: number) => {
    const rowPad = 14;
    const colPad = 6;
    // Kanan kartu
    for (let r = 1; r <= lastRow + rowPad; r++) {
      for (let c = lastCol + 1; c <= lastCol + colPad; c++) {
        sheet.getCell(r, c).fill = solid(CANVAS);
      }
    }
    // Bawah kartu
    for (let r = lastRow + 1; r <= lastRow + rowPad; r++) {
      for (let c = 1; c <= lastCol; c++) {
        sheet.getCell(r, c).fill = solid(CANVAS);
      }
    }
  };

  /** Band header gelap bermerek di 3 baris teratas tiap sheet. */
  const brandHeader = (sheet: ExcelJS.Worksheet, span: number) => {
    const paint = (r: number) => {
      for (let c = 1; c <= span; c++) sheet.getCell(r, c).fill = solid(DARK);
    };

    sheet.mergeCells(1, 1, 1, span);
    sheet.getCell(1, 1).value = `  ${input.companyName.toUpperCase()}`;
    sheet.getCell(1, 1).font = { bold: true, size: 9, color: { argb: ACCENT } };
    sheet.getCell(1, 1).alignment = { vertical: 'middle' };
    paint(1);
    sheet.getRow(1).height = 18;

    sheet.mergeCells(2, 1, 2, span);
    sheet.getCell(2, 1).value = `  ${input.title}`;
    sheet.getCell(2, 1).font = { bold: true, size: 15, color: { argb: WHITE } };
    sheet.getCell(2, 1).alignment = { vertical: 'middle' };
    paint(2);
    sheet.getRow(2).height = 26;

    sheet.mergeCells(3, 1, 3, span);
    sheet.getCell(3, 1).value = `  ${input.periodLabel}   •   ${input.generatedLabel}`;
    sheet.getCell(3, 1).font = { italic: true, size: 9, color: { argb: SUBTLE } };
    sheet.getCell(3, 1).alignment = { vertical: 'middle' };
    paint(3);
    sheet.getRow(3).height = 18;

    // Garis aksen tipis sebagai penutup band.
    for (let c = 1; c <= span; c++) sheet.getCell(4, c).fill = solid(ACCENT);
    sheet.getRow(4).height = 3;
  };

  const sectionTitle = (sheet: ExcelJS.Worksheet, r: number, text: string, span: number) => {
    const cell = sheet.getCell(r, 2);
    cell.value = text;
    cell.font = { bold: true, size: 11, color: { argb: FOREST } };
    for (let c = 2; c <= span - 1; c++) {
      sheet.getCell(r, c).border = { bottom: { style: 'thin', color: { argb: ACCENT } } };
    }
    sheet.getRow(r).height = 20;
  };

  // ================= Sheet 1: Ringkasan =================
  // Kolom A & F sengaja dibikin sempit sebagai "margin" kartu.
  const SUM_SPAN = 6;
  const summary = workbook.addWorksheet(safeSheetName(input.summarySheetName), {
    views: [{ showGridLines: false }],
  });
  [3, 28, 18, 11, 11, 3].forEach((w, i) => {
    summary.getColumn(i + 1).width = w;
  });

  brandHeader(summary, SUM_SPAN);
  let r = 6;

  sectionTitle(summary, r, input.statsSectionTitle, SUM_SPAN);
  r += 1;
  input.stats.forEach((s) => {
    summary.getRow(r).height = 18;
    const label = summary.getCell(r, 2);
    label.value = s.label;
    label.font = { color: { argb: TEXT_MUTED }, size: 10.5 };
    label.alignment = { vertical: 'middle' };

    const value = summary.getCell(r, 3);
    value.value = s.value;
    if (typeof s.value === 'number') value.numFmt = s.numFmt ?? '#,##0';
    value.font = { bold: true, size: 12, color: { argb: FOREST } };
    value.alignment = { vertical: 'middle', horizontal: 'left' };
    r += 1;
  });
  r += 1;

  input.breakdowns.forEach((b) => {
    sectionTitle(summary, r, b.title, SUM_SPAN);
    r += 1;
    b.rows.forEach((row) => {
      summary.getRow(r).height = 18;
      // Swatch + label digabung di SATU cell pakai richText — sebelumnya swatch
      // ditaruh di kolom terpisah yang lebar, jadi jaraknya menganga jauh.
      const label = summary.getCell(r, 2);
      label.value = {
        richText: [
          { text: '■  ', font: { color: { argb: hexToArgb(row.colorHex) }, size: 12 } },
          { text: row.label, font: { color: { argb: TEXT_DARK }, size: 10.5 } },
        ],
      };
      label.alignment = { vertical: 'middle' };

      const count = summary.getCell(r, 3);
      count.value = row.count;
      count.numFmt = '#,##0';
      count.font = { bold: true, size: 10.5, color: { argb: TEXT_DARK } };
      count.alignment = { vertical: 'middle', horizontal: 'right' };

      const pct = summary.getCell(r, 4);
      pct.value = row.pct / 100;
      pct.numFmt = '0%';
      pct.font = { color: { argb: TEXT_MUTED }, size: 10.5 };
      pct.alignment = { vertical: 'middle', horizontal: 'right' };
      r += 1;
    });
    r += 1;
  });

  summary.mergeCells(r, 2, r, SUM_SPAN - 1);
  const note = summary.getCell(r, 2);
  note.value = input.footerNote;
  note.font = { italic: true, size: 8.5, color: { argb: TEXT_MUTED } };
  note.alignment = { vertical: 'middle' };
  summary.getRow(r).height = 18;

  paintCanvas(summary, r, SUM_SPAN);

  // ================= Sheet 2: Detail Booking =================
  const detail = workbook.addWorksheet(safeSheetName(input.detailSheetName), {
    views: [{ showGridLines: false }],
  });
  brandHeader(detail, colCount);

  // Header tabel sengaja ditaruh dekat atas (baris 6) supaya freeze pane cuma
  // mengunci 5 baris — sisanya tetap bebas di-scroll (lihat catatan di atas).
  const headerRow = 6;
  input.headers.forEach((h, i) => {
    const cell = detail.getCell(headerRow, i + 1);
    cell.value = h;
    cell.font = { bold: true, size: 10, color: { argb: WHITE } };
    cell.fill = solid(DARK);
    cell.alignment = {
      vertical: 'middle',
      horizontal: i + 1 === TOTAL_COL ? 'right' : 'left',
      wrapText: true,
    };
    cell.border = thinBorder();
  });
  detail.getRow(headerRow).height = 24;

  let dataRow = headerRow + 1;
  if (input.rows.length === 0) {
    detail.mergeCells(dataRow, 1, dataRow, colCount);
    const cell = detail.getCell(dataRow, 1);
    cell.value = input.noDataText;
    cell.font = { italic: true, color: { argb: TEXT_MUTED } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    detail.getRow(dataRow).height = 22;
    dataRow += 1;
  } else {
    input.rows.forEach((row, i) => {
      const values: (string | number)[] = [
        row.kode,
        row.guest,
        row.wa,
        row.unit,
        row.bookingDate,
        row.checkIn,
        row.checkOut,
        row.source,
        row.total,
        row.status,
      ];
      detail.getRow(dataRow).height = 17;
      values.forEach((v, ci) => {
        const cell = detail.getCell(dataRow, ci + 1);
        cell.value = v;
        cell.border = thinBorder();
        cell.alignment = { vertical: 'middle' };
        cell.font = { size: 10, color: { argb: TEXT_DARK } };
        cell.fill = solid(i % 2 === 1 ? ZEBRA : WHITE);
        if (ci + 1 === 1) {
          cell.font = { size: 10, bold: true, color: { argb: FOREST } };
        }
        if (ci + 1 === TOTAL_COL) {
          cell.numFmt = '"Rp"#,##0';
          cell.font = { size: 10, bold: true, color: { argb: TEXT_DARK } };
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        }
        if (ci + 1 === colCount) {
          cell.font = { size: 10, bold: true, color: { argb: hexToArgb(row.statusColorHex) } };
        }
      });
      dataRow += 1;
    });

    // Baris total pakai SUM beneran (bukan angka mati) — biar tetap benar
    // kalau baris difilter/diedit langsung di Excel.
    const firstData = headerRow + 1;
    const lastData = dataRow - 1;
    for (let c = 1; c <= colCount; c++) {
      const cell = detail.getCell(dataRow, c);
      cell.fill = solid(DARK);
      cell.border = thinBorder();
      cell.font = { bold: true, size: 10, color: { argb: WHITE } };
      cell.alignment = { vertical: 'middle' };
    }
    detail.getCell(dataRow, 1).value = input.totalLabel;
    const letter = detail.getColumn(TOTAL_COL).letter;
    const sumCell = detail.getCell(dataRow, TOTAL_COL);
    sumCell.value = { formula: `SUM(${letter}${firstData}:${letter}${lastData})` };
    sumCell.numFmt = '"Rp"#,##0';
    sumCell.alignment = { vertical: 'middle', horizontal: 'right' };
    detail.getRow(dataRow).height = 21;
  }

  detail.autoFilter = {
    from: { row: headerRow, column: 1 },
    to: { row: headerRow, column: colCount },
  };
  // ySplit = 6 → cuma band brand + header tabel yang beku, sisanya scroll normal.
  detail.views = [
    { state: 'frozen', ySplit: headerRow, topLeftCell: `A${headerRow + 1}`, showGridLines: false },
  ];

  [13, 22, 16, 26, 13, 13, 13, 12, 15, 14].forEach((w, i) => {
    detail.getColumn(i + 1).width = w;
  });

  paintCanvas(detail, dataRow, colCount);

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
