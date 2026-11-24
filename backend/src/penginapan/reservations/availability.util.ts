export interface RequestedUnitItem {
  roomTypeId: number;
  qty?: number;
}

/** Jumlah unit yang diminta per tipe kamar (qty bawaan 1), diurutkan menaik
 *  menurut roomTypeId supaya urutan penguncian konsisten dan bebas deadlock. */
export function groupRequestedUnits(
  items: RequestedUnitItem[],
): [roomTypeId: number, units: number][] {
  const grouped = new Map<number, number>();
  for (const item of items) {
    grouped.set(
      item.roomTypeId,
      (grouped.get(item.roomTypeId) ?? 0) + (item.qty ?? 1),
    );
  }
  return [...grouped.entries()].sort((a, b) => a[0] - b[0]);
}

export function insufficientUnitsMessage(
  roomTypeName: string,
  availableUnits: number,
): string {
  return `${roomTypeName} hanya tersisa ${availableUnits} unit untuk tanggal yang dipilih`;
}
