/** Transform class-transformer: pangkas spasi di awal/akhir untuk nilai teks. */
export const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
