// Data dashboard owner (MOCK). TODO(FASE 10): ganti dengan API analitik backend.

export const ownerStats = [
  { key: 'statRevenue', value: 'Rp312 jt', delta: '16,2%', up: true },
  { key: 'statBooking', value: '248', delta: '9,4%', up: true },
  { key: 'statVisitors', value: '6.412', delta: '2,1%', up: false },
  { key: 'statOccupancy', value: '74%', delta: '4,0%', up: true },
];

/** Tren pendapatan 6 bulan (juta rupiah). */
export const revenueTrend = [
  { m: 'Feb', v: 182 },
  { m: 'Mar', v: 210 },
  { m: 'Apr', v: 198 },
  { m: 'Mei', v: 245 },
  { m: 'Jun', v: 268 },
  { m: 'Jul', v: 312 },
];

/** Pendapatan per unit bisnis (juta). Tiket & Cafe belum aktif. */
export const unitRevenue = [
  { label: 'Penginapan', value: 312, active: true },
  { label: 'Tiket Masuk', value: 0, active: false },
  { label: 'Cafe', value: 0, active: false },
];

export const bookingByType = [
  { label: 'Glamping Deluxe', value: 42, color: '#1B4332' },
  { label: 'Cottage Keluarga', value: 33, color: '#C1663F' },
  { label: 'Tenda Standar', value: 25, color: '#8CA98F' },
];

export const bySource = [
  { label: 'Online', value: 68, color: '#2c5a8a' },
  { label: 'Walk-in', value: 32, color: '#C1663F' },
];

export const ownerTransactions = [
  { kode: 'DGC-48213', unit: 'Penginapan', amount: 'Rp2.625.000', method: 'QRIS' },
  { kode: 'TKT-90211', unit: 'Tiket Masuk', amount: 'Rp150.000', method: 'Cash' },
  { kode: 'DGC-48212', unit: 'Penginapan', amount: 'Rp6.300.000', method: 'VA BCA' },
  { kode: 'DGC-48211', unit: 'Penginapan', amount: 'Rp850.000', method: 'Cash' },
  { kode: 'TKT-90205', unit: 'Tiket Masuk', amount: 'Rp275.000', method: 'QRIS' },
  { kode: 'DGC-48209', unit: 'Penginapan', amount: 'Rp2.625.000', method: 'Transfer' },
  { kode: 'DGC-48208', unit: 'Penginapan', amount: 'Rp6.300.000', method: 'QRIS' },
  { kode: 'TKT-90198', unit: 'Tiket Masuk', amount: 'Rp200.000', method: 'Cash' },
  { kode: 'DGC-48155', unit: 'Penginapan', amount: 'Rp4.200.000', method: 'VA Mandiri' },
  { kode: 'DGC-48150', unit: 'Penginapan', amount: 'Rp1.700.000', method: 'QRIS' },
];
